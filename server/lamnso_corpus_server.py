"""Local retrieval service for the AfriSpeech Lamnso parallel corpus.

Retrieval examples are Bible-derived and are supplied to the local translator as
orthographic/style references only. They are never shown as page translations.
Standard library only; run after tools/fetch-lamnso-corpus.py has fetched the CSVs.
"""
from __future__ import annotations

import csv
import json
import math
import re
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST, PORT = "127.0.0.1", 8769
DATA = Path(__file__).resolve().parents[1] / "data" / "nso-corpus"
TOKEN = re.compile(r"⟦[A-Z]+⟧")
WORD = re.compile(r"[\w’'-]+", re.UNICODE)
STOP = set("the a an and or to of for in on at is are be before after your you this that it with from as do does can will please wey".split())
EN_MARKERS = set("the your you is are and to for with of this that amount transfer account fees fee send check back continue pay costs beneficiary summary confirmation available balance recipient name phone number before after choose enter total status".split())
FR_MARKERS = set("le la les un une des du de votre vous est sont et à au aux pour avec montant virement compte frais envoyer vérifier avant après bénéficiaire récapitulatif confirmation disponible solde nom numéro téléphone choisir saisir".split())
CORPORA = {
    "en": DATA / "lamnso_english_erv.csv",
    "fr": DATA / "lamnso_french_bds.csv",
}
INDEX: dict[str, list[dict]] = {}
DOC_FREQ: dict[str, Counter] = {}


def terms(text: str) -> list[str]:
    text = TOKEN.sub(" ", text.lower())
    return [w.strip("-'’") for w in WORD.findall(text) if len(w.strip("-'’")) > 1 and w not in STOP]


def load() -> None:
    for lang, path in CORPORA.items():
        if not path.is_file():
            continue
        rows = []
        with path.open(encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                src, target = (row.get(lang) or "").strip(), (row.get("lns") or "").strip()
                toks = terms(src)
                if src and target and toks:
                    rows.append({"source": src, "target": target, "terms": toks, "counts": Counter(toks), "key": row.get("verse_key", "")})
        INDEX[lang] = rows
        DOC_FREQ[lang] = Counter(term for doc in rows for term in doc["counts"].keys())


def source_language(text: str) -> str:
    toks = set(terms(text))
    en, fr = len(toks & EN_MARKERS), len(toks & FR_MARKERS)
    return "fr" if fr > en else "en"


def retrieve(text: str, lang: str, limit: int = 3) -> list[dict]:
    docs = INDEX.get(lang, [])
    query = set(terms(text))
    if not docs or not query:
        return []
    n = len(docs)
    df = DOC_FREQ.get(lang, Counter())
    avg_len = sum(len(doc["terms"]) for doc in docs) / n
    k1, b = 1.2, 0.75
    scored = []
    for doc in docs:
        dl = len(doc["terms"])
        score = 0.0
        for term in query:
            tf = doc["counts"].get(term, 0)
            if not tf:
                continue
            idf = math.log(1 + (n - df[term] + 0.5) / (df[term] + 0.5))
            score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / avg_len))
        if score:
            scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    out, seen = [], set()
    for _, doc in scored:
        if doc["target"] in seen:
            continue
        seen.add(doc["target"])
        out.append({"source": doc["source"], "lamnso": doc["target"]})
        if len(out) >= limit:
            break
    return out


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status: int, body: dict) -> None:
        raw = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:
        self.send_json(204, {})

    def do_GET(self) -> None:
        if self.path != "/health":
            return self.send_json(404, {"error": "not found"})
        self.send_json(200, {"status": "ready" if INDEX else "missing-data", "englishRows": len(INDEX.get("en", [])), "frenchRows": len(INDEX.get("fr", []))})

    def do_POST(self) -> None:
        if self.path != "/examples":
            return self.send_json(404, {"error": "not found"})
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size <= 0 or size > 16000:
                raise ValueError("request must be between 1 and 16000 bytes")
            body = json.loads(self.rfile.read(size))
            text = body.get("text", "")
            if not isinstance(text, str) or not text.strip():
                raise ValueError("text is required")
            lang = body.get("source") or source_language(text)
            if lang not in CORPORA:
                raise ValueError("source must be en or fr")
            rows = retrieve(text[:1200], lang, max(1, min(int(body.get("limit", 3)), 4)))
            self.send_json(200, {"source": lang, "examples": rows, "status": "Bible-derived style examples; unvalidated"})
        except Exception as exc:  # noqa: BLE001
            self.send_json(400, {"error": str(exc)})

    def log_message(self, *_args) -> None:
        pass  # Masked page content is never logged.


if __name__ == "__main__":
    load()
    print(f"Lamnso corpus retrieval on http://{HOST}:{PORT}/examples")
    print(f"Indexed {len(INDEX.get('en', [])):,} English and {len(INDEX.get('fr', [])):,} French pairs")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
