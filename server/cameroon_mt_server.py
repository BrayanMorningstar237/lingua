"""Optional local French/English -> Lamnso' machine translation.

Uses only the two required directions from flagship-ai/cameroon-int8 and downloads
them on first use. The model is CC BY-NC 4.0: non-commercial use only unless you
obtain other permission. Outputs are unvalidated drafts; protected values are restored
verbatim by the extension and checked before display.

    pip install -r requirements-cameroon-mt.txt
    python cameroon_mt_server.py
    # http://127.0.0.1:8768/translate
"""
import json
import re
from functools import lru_cache
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import ctranslate2
from huggingface_hub import snapshot_download
from transformers import MarianTokenizer

HOST, PORT = "127.0.0.1", 8768
REPO = "flagship-ai/cameroon-int8"
TOKEN = re.compile(r"\u27e6([A-Z]+)\u27e7")
ENGLISH = re.compile(r"\b(the|your|you|is|and|to|for|with|this|amount|transfer|account|fees|send|check)\b", re.I)
FRENCH = re.compile(r"\b(le|la|les|de|du|des|votre|vous|est|et|pour|avec|montant|transfert|compte|frais|envoyer|vérifiez)\b", re.I)


@lru_cache(maxsize=3)
def load_pair(pair: str):
    local = snapshot_download(REPO, allow_patterns=[f"{pair}/*"])
    model_path = str(Path(local) / pair)
    tokenizer = MarianTokenizer.from_pretrained(model_path)
    translator = ctranslate2.Translator(model_path, device="cpu", inter_threads=1, intra_threads=2)
    return tokenizer, translator


def translate_one(text: str) -> str:
    # Keep placeholders opaque through both translation hops.
    tokens = {}

    def hide(match):
        key = f"ZXQ{len(tokens)}QXZ"
        tokens[key] = match.group(0)
        return key

    protected = TOKEN.sub(hide, text[:2000])
    english = len(ENGLISH.findall(protected)) > len(FRENCH.findall(protected))
    if english:
        tokenizer, translator = load_pair("anglais-francais")
        encoded = tokenizer.convert_ids_to_tokens(tokenizer.encode(protected))
        translated = translator.translate_batch([encoded], beam_size=4)[0].hypotheses[0]
        protected = tokenizer.decode(tokenizer.convert_tokens_to_ids(translated), skip_special_tokens=True)

    tokenizer, translator = load_pair("francais-lamnso")
    encoded = tokenizer.convert_ids_to_tokens(tokenizer.encode(protected))
    translated = translator.translate_batch([encoded], beam_size=4)[0].hypotheses[0]
    result = tokenizer.decode(tokenizer.convert_tokens_to_ids(translated), skip_special_tokens=True)
    for key, original in tokens.items():
        result = result.replace(key, original)
    return result


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status: int, body: dict):
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_json(204, {})

    def do_POST(self):
        if self.path != "/translate":
            return self.send_json(404, {"error": "not found"})
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
            if body.get("target") != "lamnso":
                return self.send_json(400, {"error": "unsupported target"})
            texts = body.get("texts", [])
            if not isinstance(texts, list) or len(texts) > 50:
                return self.send_json(400, {"error": "texts must be a list of at most 50 strings"})
            results = [translate_one(str(text)) for text in texts]
            self.send_json(200, {"translations": results, "status": "automatic-draft-unvalidated"})
        except Exception as exc:  # noqa: BLE001
            self.send_json(503, {"error": str(exc)})

    def log_message(self, *args):
        pass  # Do not log masked page content.


if __name__ == "__main__":
    print(f"Lamnso' local translation server on http://{HOST}:{PORT}/translate")
    print("First translation downloads English->French and French->Lamnso' model files.")
    print("Translations are automatic drafts. Model license: CC BY-NC 4.0.")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
