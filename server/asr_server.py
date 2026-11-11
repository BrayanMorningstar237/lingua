"""
Langwa: optional local speech server for voice questions (open source, runs on this computer).

1. Detects which language is spoken, among Langwa's languages + French and English
   (Meta MMS language identification).
2. Transcribes the question in that language (Meta MMS speech recognition, 1000+ languages).

    pip install -r requirements.txt
    python asr_server.py          # http://127.0.0.1:8767/asr
    # then in Langwa's options: Questions vocales -> Serveur local

First run downloads the models (several GB). Model licence: CC-BY-NC-4.0 (Meta MMS).
Disclose it in the submission. Coverage of each Cameroonian language depends on MMS: languages
it does not know fall back to French/English.
Audio never leaves this computer.
"""
import base64
import io
import json
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np
import torch
from transformers import AutoFeatureExtractor, AutoProcessor, Wav2Vec2ForCTC, Wav2Vec2ForSequenceClassification

HOST, PORT = "127.0.0.1", 8767
LID_MODEL = "facebook/mms-lid-256"
ASR_MODEL = "facebook/mms-1b-all"

# MMS ISO 639-3 codes -> Langwa language codes
TO_LANGWA = {
    "ewo": "ewo", "fub": "fub", "ful": "fub", "fuv": "fub", "ffm": "fub", "fuc": "fub",
    "wes": "wes", "pcm": "wes", "dua": "dua", "bbj": "bbj", "bas": "bas", "nge": "nge", "bkm": "bkm",
    "fra": "fr", "eng": "en",
}
# Langwa code -> preferred MMS speech-recognition adapters (first available is used)
ASR_CODES = {
    "ewo": ["ewo"], "fub": ["fub", "ful", "fuv"], "wes": ["wes", "pcm", "eng"], "dua": ["dua"],
    "bbj": ["bbj"], "bas": ["bas"], "nge": ["nge"], "bkm": ["bkm"], "fr": ["fra"], "en": ["eng"],
}

print("Loading language identification...")
lid_fx = AutoFeatureExtractor.from_pretrained(LID_MODEL)
lid = Wav2Vec2ForSequenceClassification.from_pretrained(LID_MODEL)
print("Loading speech recognition...")
asr_proc = AutoProcessor.from_pretrained(ASR_MODEL)
asr = Wav2Vec2ForCTC.from_pretrained(ASR_MODEL)
VOCAB = set(asr_proc.tokenizer.vocab.keys())
print("Ready.")


def read_wav(b64: str) -> np.ndarray:
    with wave.open(io.BytesIO(base64.b64decode(b64))) as w:
        frames = w.readframes(w.getnframes())
    return np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0


def detect(audio: np.ndarray, allowed: list) -> str:
    inputs = lid_fx(audio, sampling_rate=16000, return_tensors="pt")
    with torch.no_grad():
        logits = lid(**inputs).logits[0]
    labels = lid.config.id2label
    best, score = None, -1e9
    for i, iso in labels.items():
        code = TO_LANGWA.get(iso)
        if code and (code in allowed or code in ("fr", "en")) and logits[i] > score:
            best, score = code, float(logits[i])
    return best or "fr"


def transcribe(audio: np.ndarray, code: str) -> str:
    target = next((c for c in ASR_CODES.get(code, []) if c in VOCAB), "fra")
    asr_proc.tokenizer.set_target_lang(target)
    asr.load_adapter(target)
    inputs = asr_proc(audio, sampling_rate=16000, return_tensors="pt")
    with torch.no_grad():
        ids = torch.argmax(asr(**inputs).logits, dim=-1)[0]
    return asr_proc.decode(ids)


class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, body: dict):
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_POST(self):
        if self.path != "/asr":
            return self._send(404, {"error": "not found"})
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
            audio = read_wav(body["audio"])
            lang = detect(audio, body.get("languages", list(ASR_CODES)))
            self._send(200, {"lang": lang, "text": transcribe(audio, lang)})
        except Exception as exc:  # noqa: BLE001
            self._send(400, {"error": str(exc)})

    def log_message(self, *args):
        pass  # never log what people say


if __name__ == "__main__":
    print(f"Listening on http://{HOST}:{PORT}/asr")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
