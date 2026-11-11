"""
Langwa: optional local neural voice (Meta MMS-TTS, open source).

Used only to read national-language sentences that the native speaker has not recorded.
Fulfulde and Lamnso' have MMS voices (facebook/mms-tts-ful and facebook/mms-tts-lns).
Other languages rely on human recordings or a configured fallback voice.

    pip install -r requirements.txt
    python tts_server.py          # http://127.0.0.1:8766/tts  (POST {"text": "...", "lang": "ful"})

Model licence: CC-BY-NC-4.0. Disclose it in the submission.
"""
import io
import json
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import torch
from transformers import AutoTokenizer, VitsModel

HOST, PORT = "127.0.0.1", 8766
VOICES = {"ful": "facebook/mms-tts-ful", "lns": "facebook/mms-tts-lns"}
_loaded = {}


def voice(lang: str):
    if lang not in VOICES:
        raise ValueError(f"no MMS voice for '{lang}'")
    if lang not in _loaded:
        print(f"Loading {VOICES[lang]} ...")
        _loaded[lang] = (VitsModel.from_pretrained(VOICES[lang]), AutoTokenizer.from_pretrained(VOICES[lang]))
    return _loaded[lang]


def synthesize(text: str, lang: str) -> bytes:
    model, tokenizer = voice(lang)
    inputs = tokenizer(text, return_tensors="pt")
    with torch.no_grad():
        audio = model(**inputs).waveform[0].numpy()
    pcm = (audio.clip(-1, 1) * 32767).astype("<i2").tobytes()
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(model.config.sampling_rate)
        w.writeframes(pcm)
    return buf.getvalue()


class Handler(BaseHTTPRequestHandler):
    def _headers(self, code: int, ctype: str):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.end_headers()

    def do_OPTIONS(self):
        self._headers(204, "text/plain")

    def do_GET(self):
        if self.path == "/health":
            self._headers(200, "application/json")
            return self.wfile.write(b'{"status":"ready"}')
        self._headers(404, "application/json")
        self.wfile.write(b'{"error":"not found"}')

    def do_POST(self):
        if self.path != "/tts":
            self._headers(404, "application/json")
            return self.wfile.write(b'{"error":"not found"}')
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
            wav = synthesize(body["text"][:500], body.get("lang", "ful"))
            self._headers(200, "audio/wav")
            self.wfile.write(wav)
        except Exception as exc:  # noqa: BLE001
            self._headers(400, "application/json")
            self.wfile.write(json.dumps({"error": str(exc)}).encode())

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    voice("ful")
    print(f"Listening on http://{HOST}:{PORT}/tts")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
