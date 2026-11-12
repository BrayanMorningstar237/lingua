# Lamnso' parallel corpus (research only)

The local preparation script is `tools/fetch-lamnso-corpus.py`. It uses the
[AfriSpeech Africa Corpus Builder](https://github.com/AfriSpeech/africa-corpus-builder)
to retrieve two aligned files into `data/nso-corpus/`:

- `lamnso_english_erv.csv`: Lamnso' and English ERV (version 406)
- `lamnso_french_bds.csv`: Lamnso' and French Bible du Semeur (version 21)

The current local fetch produced 30,454 English pairs and 30,640 French pairs.
Both CSVs are intentionally excluded from Git. The builder checkout and generated
corpus data are also ignored; download them again with the script if needed.

## Important limitation

These are verse-aligned Bible translations from YouVersion, not conversational
or financial language. They can support Lamnso language research or carefully
curated model training, but must not be used as direct translations of banking
messages. A word such as “money” appearing in a verse does not establish a safe
translation for a balance, fee, debit, beneficiary, or transfer instruction.
The builder repository says its code is MIT licensed, but the corpus text is
third-party content and its terms must be checked before redistribution or
commercial use. See the builder's
[source and license notes](https://github.com/AfriSpeech/africa-corpus-builder#source--license).

Before using the corpus to adapt a model for the Safinum test flow, filter out
irrelevant and unsafe pairs, evaluate on held-out examples, preserve amounts
and identifiers with the extension's integrity checks, and have Lamnso speakers
review all financial wording. The corpus is connected through `server/lamnso_corpus_server.py`, which retrieves
parallel examples locally. `server/start-lamnso.cmd` starts it together with a small
local model (llama.cpp with Qwen2.5-1.5B-Instruct, Apache-2.0) on port 8771. The
background script adds the retrieved examples and matching dictionary words to
the prompt, for Lamnso only.
