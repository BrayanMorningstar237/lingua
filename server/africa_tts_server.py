"""Langwa: local natural voice (Africa TTS), light and responsive.

Africa TTS is a small open text-to-speech model (built on Kyutai's Pocket TTS, ~100M
parameters, fast on an ordinary CPU) trained on African speech, including Ewondo, Duala and
Basaa. Fulfulde, Ghomala', Ngemba and Kom are experimental (closest trained voice). Pidgin is
read with Krio, the closest trained creole. Audio never leaves this computer.

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
import re
import sys
import threading
import time
import warnings
from collections import OrderedDict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST, PORT = "127.0.0.1", 8770
MAX_TEXT = 600            # characters per request (a card or an answer)
CACHE_BYTES = 24 * 2**20  # recent phrases kept in memory (WAV bytes), about 4 minutes of speech
# Africa TTS language codes Langwa uses (Pidgin "pcm" is read as Krio, see below).
LANGS = {"ewo", "dua", "bas", "eng", "pcm", "fub", "bbj", "nge", "bkm"}

# Cameroonian Pidgin ("pcm") has no model of its own. It is read with Krio, the English-based
# creole of Sierra Leone the model was trained on (about 5 hours): its pronunciation rules and
# its own Krio speaker. Krio shares Pidgin's words and West African sound (una, wetin, pikin,
# sabi), and a Cameroonian listener chose it over the English voice in a side-by-side test.
PIDGIN_LANG = "kri"

# Pidgin text mixes Pidgin spellings (una, wetin, pikin: read well by Krio rules) with English
# words written the English way (type, page, check): Krio rules read those letter by letter
# ("tepe", "pegeh"). Krio is spelled as it sounds and never uses silent e, th, ck, ph, ou, ee,
# a final y..., so those patterns mark an English word: it gets English pronunciation, while the
# Krio speaker's voice keeps the accent. Pidgin words that look English stay Krio.
ENGLISH_SPELLING = re.compile(
    r"th|ck|ph|ou|ow|ea|ee|oo|ai|ay|oa|eo|igh|tion|sion|qu|x|wh|kn|wr|c(?!h)|[^aeiou]y|y$|[^aeiou]es$|er$|[aeiouy][bcdfgklmnprstvz]e$")
PIDGIN_NATIVE = {"dey", "wey", "sey", "shey", "una", "wuna", "wetin", "pikin", "comot", "abeg", "wahala"}


def pidgin_ipa(text: str) -> str:
    """Pidgin text -> model phonetics: English-spelled words in English, the rest with Krio rules."""
    from africa_g2p import g2p
    from africa_tts.frontend import _PUNCT, _load_codeswitch_lexicon
    lexicon = _load_codeswitch_lexicon()
    out = []
    for word in text.split():
        lead, core, trail = _PUNCT.match(word).groups()
        w = core.lower()
        if not core:
            out.append(word)
            continue
        if w in PIDGIN_NATIVE:
            ipa = g2p(re.sub(r"c(?!h)", "k", w), "kri", output="ipa")
        elif w in lexicon:  # the model's own English list (what it did before)
            ipa = lexicon[w]
        elif w.isascii() and w.isalpha() and ENGLISH_SPELLING.search(w):
            ipa = g2p(core, "eng", output="ipa").replace(" ", "")
        else:  # Pidgin spelling: Krio rules; a lone c is a k sound in Pidgin ("comot"), never "ch"
            ipa = g2p(re.sub(r"c(?!h)", "k", core), "kri", output="ipa")
        out.append(lead + ipa + trail)
    return " ".join(out)

# Fallback only (LANGWA_PIDGIN=eng): read Pidgin with English rules. English pronunciation rules
# (American, in eSpeak) get Pidgin words wrong: "una" -> "yoo-na", "am" -> "am" as in "ham",
# "e" -> "ee". Common Pidgin words are then respelled so the English rules land on the Pidgin sound.
PIDGIN = {
    "una": "oona", "wuna": "woona", "am": "ahm", "e": "eh", "don": "dawn", "di": "dee",
    "dis": "deess", "dat": "daht", "dey": "day", "wey": "way", "na": "nah", "comot": "kaw mot",
    "abeg": "ah beg", "sabi": "sah bee", "pikin": "pee keen", "wetin": "weh tin",
    "wahala": "wah hah lah", "oga": "oh gah", "im": "eem", "tok": "tawk", "moni": "money",
    "sey": "say", "kam": "kahm", "o": "oh", "shey": "shay", "dem": "dem", "fit": "fit",
    "chop": "chop", "sef": "sef", "ehn": "en", "ehen": "eh hen", "kontri": "kon tree",
    "pipul": "pee pul", "mek": "mek", "bifo": "bee for", "awa": "ah wah", "yi": "yee",
}
_WORD = __import__("re").compile(r"[A-Za-z']+")


def pidgin_respell(text: str) -> str:
    def sub(m):
        w = m.group(0)
        r = PIDGIN.get(w.lower())
        if r is None:
            return w
        return r.capitalize() if w[0].isupper() else r
    return _WORD.sub(sub, text)
if os.environ.get("LANGWA_PIDGIN") == "eng":
    PIDGIN_LANG = "eng"
WARM = [PIDGIN_LANG, "eng", "fub", "ewo", "dua", "bas"]  # warmed after "ready", most complete language first
# Voice timbre. "default" = the language's own recorded speaker. "female" = a clear female
# speaker from the model's voices (pronunciation still follows the language). Any voice id
# from models/africa-tts/voices (e.g. "hau", "yor") can also be asked for.
FEMALE = os.environ.get("LANGWA_FEMALE_VOICE", "hau")
VOICE_DIR = None  # set when the model loads
REPO = "AfriSpeech/africa-tts"
MODEL_DIR = Path(__file__).resolve().parent / "models" / "africa-tts"
NEEDED = ("config.yaml", "model.safetensors", "tokenizer.json")

STATE = {"status": "starting", "detail": "", "since": time.time()}
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


def download(folder: Path = MODEL_DIR, progress=None) -> None:
    """Resumable download with the standard library: a dropped connection continues where it
    stopped, so even a slow or unstable line gets there. progress(done_bytes, total_bytes), if
    given, is called as bytes arrive (voice_setup.py shows it live) instead of logging."""
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
    if not progress:
        log(f"{len(files)} files, {total / 1e6:.0f} MB -> {folder}")
    done_bytes = 0
    for f in files:
        dest = folder / f["path"]
        dest.parent.mkdir(parents=True, exist_ok=True)
        part = dest.with_name(dest.name + ".part")
        if dest.is_file() and dest.stat().st_size == f["size"]:
            done_bytes += f["size"]
            if progress:
                progress(done_bytes, total)
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
                        if progress:
                            progress(done_bytes + have, total)
                        elif time.time() - last > 5:
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
    if progress:
        progress(total, total)
    else:
        log(f"model ready in {folder}")


def total_ram_gb() -> float:
    try:
        if os.name == "nt":
            import ctypes

            class MS(ctypes.Structure):
                _fields_ = [("len", ctypes.c_ulong), ("load", ctypes.c_ulong)] + [
                    (n, ctypes.c_ulonglong) for n in ("total", "avail", "ptotal", "pavail", "vtotal", "vavail", "ext")]
            m = MS()
            m.len = ctypes.sizeof(MS)
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
            return m.total / 2**30
        return os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 2**30
    except Exception:  # noqa: BLE001
        return 8.0


def worker_main(conn, folder: str, nthreads: int, quantize: bool) -> None:
    """The model lives in this separate process. Closing it gives ALL its memory back to the
    system, which a single process cannot do (the C allocator keeps freed memory)."""
    try:
        conn.send(("status", "loading", "importing PyTorch"))
        import numpy as np
        import soundfile as sf
        import torch
        torch.set_num_threads(nthreads)
        torch.set_grad_enabled(False)
        warnings.filterwarnings("ignore")
        use_bundled_espeak()
        from africa_tts import AfricaTTS

        conn.send(("status", "loading", f"loading the model on CPU ({nthreads} threads)"))
        model = AfricaTTS.load(name=folder, download=False, threads=nthreads)
        if quantize:
            # Kyutai's recommended int8 for the transformer (attention + feed-forward). The flow
            # network and the Mimi audio decoder, which shape the sound, stay in full precision.
            try:
                from pocket_tts.quantization import RECOMMENDED_CONFIG, apply_dynamic_int8
                tts = next(v for v in (getattr(model.engine, a, None) for a in dir(model.engine))
                           if v is not None and hasattr(v, "flow_lm"))
                apply_dynamic_int8(tts.flow_lm, RECOMMENDED_CONFIG)
            except Exception as exc:  # noqa: BLE001  full precision still works
                quantize = False
                conn.send(("log", f"int8 not applied ({exc}); using full precision"))
        # Ready as soon as the model is loaded (about half the start-up time). The voices are then
        # warmed one short phrase at a time, only while nothing is waiting: a real request stops
        # the warm-up and is served at once (a voice not warmed yet is just a little slower once).
        conn.send(("status", "ready", "int8" if quantize else "full precision"))
        voices = Path(folder) / "voices"
        for lang in WARM:
            for vp in (None, str(voices / f"{FEMALE}.wav")):
                if conn.poll():
                    break
                try:
                    model.generate("Ok.", lang=lang, voice=vp)
                except Exception:  # noqa: BLE001
                    pass
            else:
                continue
            break
        while True:
            req = conn.recv()
            if req is None:
                break
            text, lang, vpath = req
            try:
                if lang == "pcm":  # Pidgin: phonetics built word by word, read by the Krio speaker
                    audio = model.generate(pidgin_ipa(text), lang="kri", voice=vpath, ipa=True)
                else:
                    audio = model.generate(text, lang=lang, voice=vpath)
                buf = io.BytesIO()
                sf.write(buf, np.clip(audio, -1.0, 1.0), model.sample_rate, format="WAV", subtype="PCM_16")
                conn.send(("ok", buf.getvalue()))
            except Exception as exc:  # noqa: BLE001
                conn.send(("err", str(exc)))
    except (EOFError, KeyboardInterrupt, BrokenPipeError):
        pass
    except Exception as exc:  # noqa: BLE001
        try:
            conn.send(("status", "error", str(exc)))
        except Exception:  # noqa: BLE001
            pass


class Voice:
    """Starts the model when it is needed and puts it to sleep when it is not: on a computer
    with little memory, the voice costs almost nothing between uses."""

    def __init__(self, folder: Path, idle_min: float, quantize: bool):
        self.folder, self.idle, self.quantize = folder, idle_min * 60, quantize
        self.proc = self.conn = None
        self.last = time.time()
        self.boot_lock = threading.Lock()
        threading.Thread(target=self._sleeper, daemon=True).start()

    def wake(self) -> None:
        with self.boot_lock:
            if self.proc is not None and self.proc.is_alive():
                return
            if not model_ready(self.folder):
                set_state("error", f"model not found in {self.folder}: run  python africa_tts_server.py --download")
                return
            import multiprocessing as mp
            ctx = mp.get_context("spawn")
            parent, child = ctx.Pipe()
            self.proc = ctx.Process(target=worker_main, args=(child, str(self.folder), threads(), self.quantize), daemon=True)
            self.proc.start()
            self.conn, self.last = parent, time.time()
            set_state("loading", "starting the voice")
            threading.Thread(target=self._boot, args=(parent,), daemon=True).start()

    def _boot(self, conn) -> None:
        t0 = time.time()
        try:
            while True:
                msg = conn.recv()
                if msg[0] == "log":
                    log(msg[1])
                    continue
                _, status, detail = msg
                if status == "ready":
                    self.last = time.time()
                    set_state("ready", f"model loaded in {time.time() - t0:.0f}s ({detail})")
                    return
                set_state(status, detail)
                if status == "error":
                    return
        except (EOFError, OSError):
            set_state("error", "the voice process stopped")

    def speak(self, text: str, lang: str, vpath) -> bytes:
        with LOCK:  # one synthesis at a time: predictable CPU use
            self.last = time.time()
            self.conn.send((text, lang, vpath))
            if not self.conn.poll(90):
                raise TimeoutError("the voice took too long")
            kind, data = self.conn.recv()
            self.last = time.time()
        if kind != "ok":
            raise RuntimeError(data)
        return data

    def sleep(self) -> None:
        with self.boot_lock, LOCK:
            if self.proc is None:
                return
            try:
                self.conn.send(None)
                self.proc.join(5)
            except Exception:  # noqa: BLE001
                pass
            if self.proc.is_alive():
                self.proc.terminate()
            self.proc = self.conn = None
            set_state("sleeping", "asleep to save memory; wakes up on the next request")

    def _sleeper(self) -> None:
        while True:
            time.sleep(15)
            if self.idle > 0 and STATE["status"] == "ready" and time.time() - self.last > self.idle:
                self.sleep()


VOICE = None


# Languages whose own recorded speaker is already female: "female" keeps it, because a voice
# trained on the language's own speech sounds more natural than a borrowed one. English is a
# native Ghanaian English speaker; Pidgin always keeps the Krio speaker (the one people chose).
OWN_FEMALE = {"eng", "pcm"}


def voice_path(voice: str, lang: str = ""):
    """None = the language's default speaker; else a bundled reference voice file."""
    if not voice or voice == "default" or VOICE_DIR is None or (voice == "female" and lang in OWN_FEMALE):
        return None
    vid = FEMALE if voice == "female" else voice
    path = VOICE_DIR / f"{vid}.wav"
    if not (len(vid) <= 8 and vid.isalnum() and path.is_file()):
        raise ValueError(f"unknown voice: {voice}")
    return str(path)


def synthesize(text: str, lang: str, voice: str = "") -> bytes:
    if lang not in LANGS:
        raise ValueError(f"unsupported language code: {lang}")
    vpath = voice_path(voice, lang)
    key = (lang, voice or 'default', text)
    if key in CACHE:
        CACHE.move_to_end(key)
        return CACHE[key]
    if lang == "pcm":  # Krio rules read Pidgin spelling as written; English rules need respelling
        model_text, model_lang = (text, "pcm") if PIDGIN_LANG == "kri" else (pidgin_respell(text), "eng")
    else:
        model_text, model_lang = text, lang
    wav = VOICE.speak(model_text[:MAX_TEXT], model_lang, vpath)
    CACHE[key] = wav
    while len(CACHE) > 1 and sum(len(v) for v in CACHE.values()) > CACHE_BYTES:
        CACHE.popitem(last=False)
    return wav


class Handler(BaseHTTPRequestHandler):
    def handle(self):
        try:
            super().handle()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass  # the browser stopped waiting (page closed, time limit): harmless, keep the window clean

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
            return self._json(200, {**STATE, "cached": len(CACHE), "threads": threads(),
                                    "idleMinutes": VOICE.idle / 60, "int8": VOICE.quantize})
        self._json(404, {"error": "not found"})

    def do_POST(self):
        if self.path == "/wake":  # Langwa opens a page: get ready before the first Listen
            VOICE.wake()
            return self._json(200, STATE)
        if self.path != "/tts":
            return self._json(404, {"error": "not found"})
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size <= 0 or size > 32_000:
                raise ValueError("request body must be between 1 and 32000 bytes")
            body = json.loads(self.rfile.read(size))
            text, lang = body.get("text", ""), body.get("lang", "")
            voice = str(body.get("voice") or "")
            if not isinstance(text, str) or not text.strip():
                raise ValueError("text is required")
            cached = CACHE.get((lang, voice or "default", text.strip()))
            if cached is None and STATE["status"] != "ready":
                # asleep or loading: wake up, and the extension uses another voice meanwhile
                VOICE.wake()
                return self._json(503, {"error": "loading", "detail": STATE["detail"]})
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
    ap.add_argument("--idle", type=float, default=None,
                    help="minutes without use before the model sleeps (0 = never); "
                         "default: 10 with 8 GB of RAM or less, else 60")
    ap.add_argument("--full-precision", action="store_true", help="do not use int8 for the transformer")
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
    global VOICE, VOICE_DIR
    ram = total_ram_gb()
    idle = args.idle if args.idle is not None else (10 if ram <= 8.5 else 60)
    VOICE_DIR = args.model / "voices"
    VOICE = Voice(args.model, idle, quantize=not args.full_precision)
    VOICE.wake()
    log(f"listening on http://{HOST}:{args.port}/tts  (status: GET /health)")
    log(f"{ram:.0f} GB of RAM: the model sleeps after {idle:g} min without use" if idle else "the model stays loaded")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)


if __name__ == "__main__":
    main()
