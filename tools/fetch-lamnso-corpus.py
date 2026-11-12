#!/usr/bin/env python3
"""Fetch local Lamnso-English/French parallel corpus files for research.

Requires the AfriSpeech africa-corpus-builder checkout at
data/africa-corpus-builder and huggingface_hub in the active Python environment.
The generated Bible-derived CSVs are local research data and are git-ignored.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILDER = ROOT / "data" / "africa-corpus-builder" / "africa_corpus.py"
OUT = ROOT / "data" / "nso-corpus"


def load_builder():
    if not BUILDER.is_file():
        raise SystemExit(
            "Builder missing. Clone https://github.com/AfriSpeech/africa-corpus-builder "
            "to data/africa-corpus-builder first."
        )
    spec = importlib.util.spec_from_file_location("africa_corpus", BUILDER)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Could not load corpus builder: {BUILDER}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    corpus = load_builder()
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = (
        ("en@406", "lamnso_english_erv.csv"),  # English Easy-to-Read Bible
        ("fr@21", "lamnso_french_bds.csv"),    # French Bible du Semeur
    )
    for target, filename in jobs:
        path = OUT / filename
        count = corpus.write_parallel_csv("lns", target, str(path))
        print(f"Wrote {count:,} aligned rows to {path.relative_to(ROOT)}")
    print("Source text is Bible-derived. Do not treat rows as banking translations or redistribute without checking source terms.")


if __name__ == "__main__":
    main()
