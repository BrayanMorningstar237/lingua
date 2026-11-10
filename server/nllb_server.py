"""
Mboa Lingua: optional local translation server using Meta's open NLLB-200 model.

Only masked text reaches this server (amounts, names and numbers are already replaced
by tokens such as ⟦A⟧ in the browser). It listens on 127.0.0.1 only.

    pip install -r requirements.txt
    python nllb_server.py            # first run downloads ~2.5 GB (distilled 600M model)

NLLB-200 covers Nigerian Fulfulde (fuv_Latn), the closest Fulfulde variety it supports;
it does not cover Ewondo, Duala, Ghomala' or Basaa. Output is never trusted as-is:
the extension checks every token and number and falls back to the safe summary.
Model licence: CC-BY-NC-4.0 (weights), code MIT. Disclose this in the submission.
"""
import json
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

MODEL = "facebook/nllb-200-distilled-600M"
HOST, PORT = "127.0.0.1", 8765

print(f"Loading {MODEL} ...")
tokenizer = AutoTokenizer.from_pretrained(MODEL)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL)
print("Ready.")

TOKEN = re.compile(r"⟦([A-Z]+)⟧")


def guess_src(text: str) -> str:
    fr = len(re.findall(r"\b(le|la|les|de|du|des|votre|vous|est|et|à|pour|une?)\b", text, re.I))
    en = len(re.findall(r"\b(the|of|your|you|is|and|to|for|an?)\b", text, re.I))
    return "fra_Latn" if fr >= en else "eng_Latn"


def translate(text: str, tgt: str) -> str:
    # Tokens become capitalised nonsense words, which NLLB usually copies unchanged.
    protected = TOKEN.sub(lambda m: f"ZQ{m.group(1)}Q", text)
    tokenizer.src_lang = guess_src(text)
    inputs = tokenizer(protected, return_tensors="pt", truncation=True, max_length=256)
    out = model.generate(
        **inputs,
        forced_bos_token_id=tokenizer.convert_tokens_to_ids(tgt),
        max_new_tokens=256,
        num_beams=4,
    )
    result = tokenizer.batch_decode(out, skip_special_tokens=True)[0]
    return re.sub(r"ZQ([A-Z]+)Q", lambda m: f"⟦{m.group(1)}⟧", result)


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
        if self.path != "/translate":
            return self._send(404, {"error": "not found"})
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
            texts, tgt = body["texts"], body["tgt"]
            self._send(200, {"translations": [translate(t, tgt) for t in texts[:50]]})
        except Exception as exc:  # noqa: BLE001
            self._send(400, {"error": str(exc)})

    def log_message(self, *args):
        pass  # do not log the (masked) content


if __name__ == "__main__":
    print(f"Listening on http://{HOST}:{PORT}/translate")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
