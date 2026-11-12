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
import gc
import os
import re
from functools import lru_cache
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import ctranslate2

HOST, PORT = "127.0.0.1", 8768
REPO = "flagship-ai/cameroon-int8"
MODEL_CACHE = Path(__file__).resolve().parent / "models" / "huggingface"
os.environ.setdefault("HF_HOME", str(MODEL_CACHE))
os.environ.setdefault("HUGGINGFACE_HUB_CACHE", str(MODEL_CACHE / "hub"))
from huggingface_hub import snapshot_download
from transformers import MarianTokenizer
TOKEN = re.compile(r"\u27e6([A-Z]+)\u27e7")
ENGLISH = re.compile(
    r"\b(the|a|an|your|you|is|are|and|to|for|with|of|this|that|amount|transfer|account|fees|fee|send|check|"
    r"back|continue|pay|costs|beneficiary|summary|confirmation|confirm|available|balance|recipient|name|phone|number|"
    r"review|before|after|completed|success|successful|hello|welcome|recent|transactions|enter|choose|select|view|"
    r"operation|type|total|debit|received|salary|merchant|payment|electricity|bill|service|free|security|always|"
    r"warning|status|new|page|what|who|how|much|money|online|banking)\b",
    re.I,
)
FRENCH = re.compile(r"\b(le|la|les|de|du|des|votre|vous|est|et|pour|avec|montant|transfert|compte|frais|envoyer|vérifiez)\b", re.I)


@lru_cache(maxsize=3)
def load_pair(pair: str):
    local = snapshot_download(REPO, allow_patterns=[f"{pair}/*"], cache_dir=str(MODEL_CACHE / "hub"))
    model_path = str(Path(local) / pair)
    tokenizer = MarianTokenizer.from_pretrained(model_path)
    translator = ctranslate2.Translator(model_path, device="cpu", inter_threads=1, intra_threads=1)
    return tokenizer, translator


def translate_many(texts: list[str]) -> list[str]:
    # Keep placeholders opaque through both translation hops.
    tokens_by_text = []
    protected = []
    english_indexes = []
    for raw in texts:
        tokens = {}

        def hide(match):
            key = f"ZXQ{len(tokens)}QXZ"
            tokens[key] = match.group(0)
            return key

        value = TOKEN.sub(hide, str(raw)[:2000])
        if len(ENGLISH.findall(value)) > len(FRENCH.findall(value)):
            english_indexes.append(len(protected))
        protected.append(value)
        tokens_by_text.append(tokens)

    # Batch the English pivot first, then release its model before loading Lamnso'.
    # Keeping both CTranslate2 models resident can exceed memory on ordinary laptops.
    if english_indexes:
        load_pair.cache_clear()
        gc.collect()
        tokenizer, translator = load_pair("english-francais")
        encoded = [tokenizer.convert_ids_to_tokens(tokenizer.encode(protected[i])) for i in english_indexes]
        translated = translator.translate_batch(encoded, beam_size=4)
        for i, result in zip(english_indexes, translated):
            ids = tokenizer.convert_tokens_to_ids(result.hypotheses[0])
            protected[i] = tokenizer.decode(ids, skip_special_tokens=True)
        load_pair.cache_clear()
        del translator, tokenizer, encoded, translated
        gc.collect()

    tokenizer, translator = load_pair("francais-lamnso")
    encoded = [tokenizer.convert_ids_to_tokens(tokenizer.encode(text)) for text in protected]
    translated = translator.translate_batch(encoded, beam_size=4)
    results = []
    for i, result in enumerate(translated):
        ids = tokenizer.convert_tokens_to_ids(result.hypotheses[0])
        text = tokenizer.decode(ids, skip_special_tokens=True)
        for key, original in tokens_by_text[i].items():
            text = text.replace(key, original)
        results.append(text)
    return results


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
            results = translate_many([str(text) for text in texts])
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
