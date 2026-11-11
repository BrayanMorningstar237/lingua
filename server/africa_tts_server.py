"""Langwa: local natural voice (Africa TTS), light and responsive.

Africa TTS is a small open text-to-speech model (built on Kyutai's Pocket TTS, ~100M
parameters, fast on an ordinary CPU) trained on African speech, including Ewondo, Duala and
Basaa. Fulfulde, Ghomala', Ngemba and Kom are experimental (closest trained voice). Pidgin is
read with the English voice. Audio never leaves this computer.

    pip install -r requirements-africa-tts.txt
    python africa_tts_server.py --download   # once: fetch the ~440 MB model (resumes after drops)
    python africa_tts_server.py              # http://127.0.0.1:8770/tts  (GET /health)

The model is kept in server/models/africa-tts. On a slow connection, run --download again at
any time: it continues where it stopped. Or copy that folder from a computer that has it, or
point to any copy with --model PATH.

Light by design:
- the port opens at once; the model loads in the background (GET /health shows progress) and
  the extension uses the browser's voices until it is ready, so nobody waits;
- at most half the CPU cores are used, no gradients, no temporary files;
- recent phrases are cached in memory, voices are prepared ahead for Langwa's languages.

Model and bundled voices: CC-BY-NC-4.0 (AfriSpeech). Code: MIT.
"""
import argparse
import io
import json
import os
import sys
import threading
import time
import warnings
from collections import OrderedDict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST, PORT = "127.0.0.1", 8770
MAX_TEXT = 600            # characters per request (a card or an answer)
CACHE_MAX = 300           # recent phrases kept in memory
# Africa TTS language codes Langwa uses (Pidgin is sent as "eng").
LANGS = {"ewo", "dua", "bas", "eng", "fub", "bbj", "nge", "bkm"}
WARM = ["eng", "ewo", "dua", "bas", "fub"]  # voices prepared ahead
# Voice timbre. "default" = the language's own recorded speaker. "female" = a clear female
# speaker from the model's voices (pronunciation still follows the language). Any voice id
# from models/africa-tts/voices (e.g. "hau", "yor") can also be asked for.
FEMALE = os.environ.get("LANGWA_FEMALE_VOICE", "hau")
VOICE_DIR = None  # set when the model loads
REPO = "AfriSpeech/africa-tts"
MODEL_DIR = Path(__file__).resolve().parent / "models" / "africa-tts"
NEEDED = ("config.yaml", "model.safetensors", "tokenizer.json")

STATE = {"status": "starting", "detail": "", "since": time.time()}
MODEL = None
LOCK = threading.Lock()
CACHE: "OrderedDict[tuple, bytes]" = OrderedDict()


def log(msg: str) -> None:
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def set_state(status: str, detail: str = "") -> None:
    STATE.update(status=status, detail=detail, since=time.time())
    log(f"{status}{': ' + detail if detail else ''}")


def threads() -> int:
    return max(1, min(4, (os.cpu_count() or 2) // 2))


def use_bundled_espeak() -> None:
    """English (and Pidgin) pronunciation needs eSpeak NG. espeakng-loader ships it for
    Windows, macOS and Linux, so nothing has to be installed system-wide."""
    try:
        import espeakng_loader
        from phonemizer.backend.espeak.wrapper import EspeakWrapper
    except ImportError:
        return
    os.environ.setdefault("PHONEMIZER_ESPEAK_LIBRARY", espeakng_loader.get_library_path())
    os.environ.setdefault("ESPEAK_DATA_PATH", espeakng_loader.get_data_path())
    EspeakWrapper.set_library(os.environ["PHONEMIZER_ESPEAK_LIBRARY"])
    if hasattr(EspeakWrapper, "set_data_path"):
        EspeakWrapper.set_data_path(os.environ["ESPEAK_DATA_PATH"])


def model_ready(folder: Path) -> bool:
    return all((folder / f).is_file() for f in NEEDED) and any((folder / "voices").glob("*.wav"))


def download(folder: Path = MODEL_DIR) -> None:
    """Resumable download with the standard library: a dropped connection continues where it
    stopped, so even a slow or unstable line gets there."""
    import urllib.request

    def get(url, headers=None):
        return urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}), timeout=60)

    tree = []
    for sub in ("", "/voices"):  # only the two folders needed (the repo holds 1000+ other files)
        with get(f"https://huggingface.co/api/models/{REPO}/tree/main{sub}") as r:
            tree += json.loads(r.read())
    files = [f for f in tree if f.get("type") == "file" and (
        f["path"] in NEEDED or (f["path"].startswith("voices/") and f["path"].endswith((".wav", ".json"))))]
    total = sum(f["size"] for f in files)
    log(f"{len(files)} files, {total / 1e6:.0f} MB -> {folder}")
    done_bytes = 0
    for f in files:
        dest = folder / f["path"]
        dest.parent.mkdir(parents=True, exist_ok=True)
        part = dest.with_name(dest.name + ".part")
        if dest.is_file() and dest.stat().st_size == f["size"]:
            done_bytes += f["size"]
            continue
        url = f"https://huggingface.co/{REPO}/resolve/main/{f['path']}"
        tries, last = 0, time.time()
        while True:
            have = part.stat().st_size if part.exists() else 0
            if have >= f["size"]:
                break
            try:
                with get(url, {"Range": f"bytes={have}-"}) as r, open(part, "ab" if r.status == 206 else "wb") as out:
                    if r.status != 206:
                        have = 0
                    while chunk := r.read(1 << 16):
                        out.write(chunk)
                        have += len(chunk)
                        if time.time() - last > 5:
                            last = time.time()
                            pct = 100 * (done_bytes + have) / total
                            log(f"{f['path']}: {have / 1e6:.0f}/{f['size'] / 1e6:.0f} MB  (all: {pct:.0f}%)")
                tries = 0
            except Exception as exc:  # noqa: BLE001  dropped line: wait a little, continue
                tries += 1
                wait = min(60, 3 * tries)
                log(f"connection lost ({exc.__class__.__name__}), resuming in {wait}s")
                time.sleep(wait)
        part.replace(dest)
        done_bytes += f["size"]
    log(f"model ready in {folder}")


def load_model(folder: Path) -> None:
    """Runs in the background: the HTTP port is already open while this works."""
    global MODEL, VOICE_DIR
    try:
        set_state("loading", "importing PyTorch")
        import torch
        torch.set_num_threads(threads())
        torch.set_grad_enabled(False)
        warnings.filterwarnings("ignore", message=".*experimental.*")
        use_bundled_espeak()
        from africa_tts import AfricaTTS

        if not model_ready(folder):
            set_state("error", f"model not found in {folder}: run  python africa_tts_server.py --download")
            return
        set_state("loading", f"loading the model on CPU ({threads()} threads)")
        t0 = time.time()
        model = AfricaTTS.load(name=str(folder), download=False, threads=threads())
        set_state("loading", "preparing the voices")
        for lang in WARM:  # one short phrase per voice: the first real request is then quick
            try:
                model.generate("Ok.", lang=lang)
                model.generate("Ok.", lang=lang, voice=str(folder / "voices" / f"{FEMALE}.wav"))
            except Exception as exc:  # noqa: BLE001
                log(f"voice {lang} not ready: {exc}")
        VOICE_DIR = folder / "voices"
        MODEL = model
        set_state("ready", f"model loaded in {time.time() - t0:.0f}s")
    except Exception as exc:  # noqa: BLE001
        set_state("error", str(exc))


def voice_path(voice: str):
    """None = the language's default speaker; else a bundled reference voice file."""
    if not voice or voice == "default" or VOICE_DIR is None:
        return None
    vid = FEMALE if voice == "female" else voice
    path = VOICE_DIR / f"{vid}.wav"
    if not (len(vid) <= 8 and vid.isalnum() and path.is_file()):
        raise ValueError(f"unknown voice: {voice}")
    return str(path)


def synthesize(text: str, lang: str, voice: str = "") -> bytes:
    if lang not in LANGS:
        raise ValueError(f"unsupported language code: {lang}")
    vpath = voice_path(voice)
    key = (lang, voice or 'default', text)
    if key in CACHE:
        CACHE.move_to_end(key)
        return CACHE[key]
    import numpy as np
    import soundfile as sf

    with LOCK:  # one synthesis at a time: predictable CPU use
        audio = MODEL.generate(text[:MAX_TEXT], lang=lang, voice=vpath)
    buf = io.BytesIO()
    sf.write(buf, np.clip(audio, -1.0, 1.0), MODEL.sample_rate, format="WAV", subtype="PCM_16")
    wav = buf.getvalue()
    CACHE[key] = wav
    if len(CACHE) > CACHE_MAX:
        CACHE.popitem(last=False)
    return wav


class Handler(BaseHTTPRequestHandler):
    def _headers(self, status: int, content_type: str):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def _json(self, status: int, body: dict):
        self._headers(status, "application/json")
        self.wfile.write(json.dumps(body).encode("utf-8"))

    def do_OPTIONS(self):
        self._headers(204, "text/plain")

    def do_GET(self):
        if self.path == "/health":
            return self._json(200, {**STATE, "cached": len(CACHE), "threads": threads()})
        self._json(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/tts":
            return self._json(404, {"error": "not found"})
        if MODEL is None:  # still loading: the extension uses another voice meanwhile
            return self._json(503, {"error": STATE["status"], "detail": STATE["detail"]})
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size <= 0 or size > 32_000:
                raise ValueError("request body must be between 1 and 32000 bytes")
            body = json.loads(self.rfile.read(size))
            text, lang = body.get("text", ""), body.get("lang", "")
            voice = str(body.get("voice") or "")
            if not isinstance(text, str) or not text.strip():
                raise ValueError("text is required")
            t0 = time.time()
            wav = synthesize(text.strip(), lang, voice)
            self._headers(200, "audio/wav")
            self.wfile.write(wav)
            log(f"spoke {len(text)} chars in {lang} ({time.time() - t0:.1f}s)")
        except Exception as exc:  # noqa: BLE001
            self._json(400, {"error": str(exc)})

    def log_message(self, *_args):
        pass  # never log page text


def main() -> None:
    ap = argparse.ArgumentParser(description="Langwa local voice (Africa TTS)")
    ap.add_argument("--download", action="store_true", help="download the model (resumable), then exit")
    ap.add_argument("--model", type=Path, default=Path(os.environ.get("LANGWA_TTS_MODEL", MODEL_DIR)),
                    help="folder holding a copy of the model (default: server/models/africa-tts)")
    ap.add_argument("--port", type=int, default=PORT)
    args = ap.parse_args()

    if args.download:
        download(args.model)
        return

    # Windows lets two processes share a port with SO_REUSEADDR: refuse instead, so a second
    # copy fails clearly rather than answering half of the requests.
    ThreadingHTTPServer.allow_reuse_address = os.name != "nt"
    try:
        server = ThreadingHTTPServer((HOST, args.port), Handler)
    except OSError:
        log(f"port {args.port} is already in use: Langwa's voice is probably already running")
        sys.exit(1)
    threading.Thread(target=load_model, args=(args.model,), daemon=True).start()
    log(f"listening on http://{HOST}:{args.port}/tts  (status: GET /health)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)


if __name__ == "__main__":
    main()
