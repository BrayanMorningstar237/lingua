"""Langwa voice: first-time setup with live progress, then the voice itself.

Started by start-voice.cmd / start-voice.sh once Python exists. Standard library only.

- At once it answers GET /health on the voice port with live progress, so Langwa's settings page
  can show a progress bar, the time left and that text translation already works:
      {"status": "installing", "step": "packages"|"model", "progress": 0.42, "etaSec": 300, ...}
- It installs the voice packages (with uv when given, else pip), then downloads the model
  (real byte counts, resumable). Steps already done are skipped, so later starts take no time here.
- Then it becomes the voice server in the same process: the port is never left empty.

    python voice_setup.py [--uv PATH] [voice server options...]
"""
import json
import os
import re
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import africa_tts_server as tts  # noqa: E402  (light: heavy imports happen later, inside functions)

ROOT = HERE.parent
READY = Path(sys.prefix) / ".langwa-voice-ready"
PKG_GUESS = 240e6    # bytes, until uv has listed what it downloads
MODEL_GUESS = 440e6

P = {"step": "", "pkgTotal": 0.0, "pkgDone": 0.0, "modelTotal": 0.0, "modelDone": 0.0,
     "rate": 0.0, "detail": "", "t0": time.time()}
LOCK = threading.Lock()


def snapshot() -> dict:
    with LOCK:
        total = P["pkgTotal"] + P["modelTotal"]
        done = P["pkgDone"] + P["modelDone"]
        prog = max(done / total if total else 0.0, P.get("shown", 0.0))  # a bar never goes backwards
        P["shown"] = prog
        eta = (total - done) / P["rate"] if P["rate"] > 0 and time.time() - P["t0"] > 8 else None
        return {"status": "installing", "step": P["step"], "detail": P["detail"],
                "progress": round(min(prog, 0.999), 4),
                "etaSec": round(eta) if eta is not None else None,
                "doneMB": round(done / 1e6), "totalMB": round(total / 1e6), "textReady": True}


class Status(BaseHTTPRequestHandler):
    def handle(self):
        try:
            super().handle()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass  # a status check gave up: harmless

    def do_GET(self):
        body = json.dumps(snapshot() if self.path == "/health" else {"error": "installing"}).encode()
        self.send_response(200 if self.path == "/health" else 503)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        # Cancel, from the progress page only: it is a local file (Origin "null"). A website
        # (any real origin) is refused, so no page on the internet can stop a setup.
        if self.path == "/cancel":
            ok = self.headers.get("Origin") in (None, "null")
            self.send_response(200 if ok else 403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"cancelled": ok}).encode())
            if ok:
                threading.Thread(target=cancel, daemon=True).start()
            return
        self.do_GET()

    def log_message(self, *_):
        pass


CANCELLED = 4  # exit code: the user cancelled (the launcher shows no error for it)
PROC = {"p": None}


def cancel() -> None:
    """Stop the download now; what is already downloaded stays, so the next start resumes."""
    time.sleep(0.3)  # let the answer reach the page
    p = PROC["p"]
    if p and p.poll() is None:
        if os.name == "nt":
            subprocess.run(["taskkill", "/T", "/F", "/PID", str(p.pid)], capture_output=True)
        else:
            p.kill()
    print("\n[Langwa] Setup cancelled. Start it again to resume. / Installation annulee.", flush=True)
    os._exit(CANCELLED)


# ---------- console progress bar (one line, redrawn twice a second) ----------
TTY = sys.stdout.isatty()
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(errors="replace")
LABEL = {"packages": "Installing the voice / Installation de la voix",
         "model": "Downloading the voice model / Telechargement du modele"}


def fmt_eta(sec) -> str:
    if sec is None:
        return "estimating..."
    return "less than a minute" if sec < 60 else f"about {round(sec / 60)} min left"


def painter(stop: threading.Event) -> None:
    last_step, last_log = "", 0.0
    while not stop.wait(0.5):
        s = snapshot()
        if s["step"] != last_step:
            last_step = s["step"]
            print(("\n" if TTY else "") + f"[Langwa] {LABEL.get(last_step, last_step)}", flush=True)
        pct = s["progress"] * 100
        if TTY:
            n = int(pct / 100 * 30)
            line = f"  [{'#' * n}{'.' * (30 - n)}] {pct:4.0f}%  {s['doneMB']}/{s['totalMB']} MB  {fmt_eta(s['etaSec'])}"
            print("\r" + line.ljust(78), end="", flush=True)
        elif time.time() - last_log > 10:
            last_log = time.time()
            print(f"  {pct:.0f}%  {s['doneMB']}/{s['totalMB']} MB  {fmt_eta(s['etaSec'])}", flush=True)


def note_rate(done_now: float, since: float, done_then: float) -> None:
    """Smoothed download speed (bytes/s) for the time-left estimate."""
    dt = time.time() - since
    if dt > 1:
        r = (done_now - done_then) / dt
        P["rate"] = r if P["rate"] == 0 else 0.7 * P["rate"] + 0.3 * r


# ---------- step 1: packages ----------
SIZE = re.compile(r"^Downloading (\S+) \(([\d.]+)(KiB|MiB|GiB)\)")
DONE = re.compile(r"^ Download(?:ed|ing) (\S+)")
UNIT = {"KiB": 2**10, "MiB": 2**20, "GiB": 2**30}


def install(uv: str) -> None:
    req = str(HERE / "requirements-africa-tts.txt")
    cmd = ([uv, "pip", "install", "--python", sys.executable, "-r", req] if uv and Path(uv).is_file()
           else [sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "-r", req])
    sizes, finished = {}, set()
    with LOCK:
        P.update(step="packages", detail="resolving")
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                            encoding="utf-8", errors="replace", bufsize=1)
    PROC["p"] = proc
    tail = []
    t_first = None
    stop = threading.Event()

    def creep():  # between uv's lines, advance by the measured speed (never past what is pending)
        while not stop.wait(0.5):
            with LOCK:
                if not sizes:
                    continue
                exact = sum(sizes[n] for n in finished)
                pending = sum(v for k, v in sizes.items() if k not in finished)
                guess = P["rate"] * (time.time() - t_last[0]) if P["rate"] else 0
                P["pkgDone"] = max(P["pkgDone"], exact + min(guess, 0.95 * pending))  # never backwards
    t_last = [time.time()]
    threading.Thread(target=creep, daemon=True).start()
    for line in proc.stdout:
        line = line.rstrip()
        tail = (tail + [line])[-15:]
        m = SIZE.match(line)
        if m:
            with LOCK:
                sizes[m[1]] = float(m[2]) * UNIT[m[3]]
                P["pkgTotal"] = sum(sizes.values()) * 1.03  # +3%: unpacking after the downloads
                P["detail"] = "downloading"
                if t_first is None:
                    t_first = time.time()
                    t_last[0] = t_first
                    P["rate"] = 400e3  # first guess until a package finishes
            continue
        m = DONE.match(line)
        if m and m[1] in sizes and m[1] not in finished:
            with LOCK:
                finished.add(m[1])
                exact = sum(sizes[n] for n in finished)
                r = max(exact / max(time.time() - t_first, 1), 50e3)
                P["rate"] = 0.6 * P["rate"] + 0.4 * r  # smoothed, so the time left stays steady
                t_last[0] = time.time()
                P["pkgDone"] = max(P["pkgDone"], exact)
        elif line.startswith(("Prepared", "Installing")):
            with LOCK:
                P["detail"] = "unpacking"
    stop.set()
    if proc.wait() != 0:
        print("\n" + "\n".join(tail), flush=True)
        raise SystemExit("[Langwa] The voice could not be installed (often the connection). Start it again: it continues.")
    with LOCK:
        P["pkgDone"] = P["pkgTotal"]
    READY.touch()


# ---------- step 2: model ----------
def present_bytes() -> float:
    """Model bytes already on disk (complete files): only the rest is counted as work to do."""
    d = tts.MODEL_DIR
    return float(sum(f.stat().st_size for f in d.rglob("*") if f.is_file() and f.suffix != ".part")) if d.is_dir() else 0.0


def fetch_model() -> None:
    with LOCK:
        P.update(step="model", detail="downloading", rate=0.0)
    mark = {"t": time.time(), "d": 0.0}
    base = present_bytes()

    def progress(done, total):
        with LOCK:
            P["modelTotal"] = max(float(total) - base, 1.0)
            P["modelDone"] = max(P["modelDone"], min(float(done) - base, P["modelTotal"]))
            if time.time() - mark["t"] > 2:
                note_rate(done, mark["t"], mark["d"])
                mark.update(t=time.time(), d=float(done))

    tts.download(tts.MODEL_DIR, progress=progress)


def main() -> None:
    args = sys.argv[1:]
    uv = ""
    if "--uv" in args:
        i = args.index("--uv")
        uv = args[i + 1] if i + 1 < len(args) else ""
        del args[i:i + 2]

    need_pkgs = not READY.exists()
    need_model = not tts.model_ready(tts.MODEL_DIR)
    if need_pkgs or need_model:
        P["pkgTotal"] = PKG_GUESS if need_pkgs else 0.0
        P["modelTotal"] = max(MODEL_GUESS - present_bytes(), 1e6) if need_model else 0.0
        try:
            status = ThreadingHTTPServer((tts.HOST, tts.PORT), Status)
        except OSError:
            print("[Langwa] The voice is already running.", flush=True)
            return
        threading.Thread(target=status.serve_forever, daemon=True).start()
        stop = threading.Event()
        threading.Thread(target=painter, args=(stop,), daemon=True).start()
        try:
            if need_pkgs:
                install(uv)
            if need_model:
                fetch_model()
        finally:
            stop.set()
            status.shutdown()
            status.server_close()
        print("\n[Langwa] Setup complete. / Installation terminee.", flush=True)

    sys.argv = [str(HERE / "africa_tts_server.py"), *args]
    tts.main()


if __name__ == "__main__":
    main()
