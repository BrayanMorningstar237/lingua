# Langwa

**Digital banking, understood in Cameroon's national languages.** Langwa is a browser extension
that explains an unchanged banking page in **Cameroon Pidgin English** and **Fulfulde**, with
seven more languages prepared. It never changes the bank's code, and no translation can change an
amount, a fee, a name or a reference.

Built for the **SAFINUM Innovate Challenge 2026** by Team Langwa (Buea).

| | |
|---|---|
| Website and downloads | https://langwa-five.vercel.app |
| Demo video (3 minutes) | https://youtu.be/2LSA_mPtrT8 |
| Documentation (architecture, security, languages and validation, dependencies, limitations) | [docs/Langwa-Documentation.pdf](docs/Langwa-Documentation.pdf) |
| Brief description | [docs/DESCRIPTION.md](docs/DESCRIPTION.md) |

## What it does

- **Point at any text** (hold Ctrl, or no key in "Point" mode; long press on a phone): the
  translation opens just under it, with the original and a Listen button.
- **The panel** (round Langwa button, bottom right, or `Alt+Shift+M`) translates the whole page
  (`Alt+Shift+T`) and lists every message, important ones first.
- **The assistant** in the panel answers questions about the screen ("How much I go pay?") from
  what is displayed, with the exact amounts.
- **New messages** (an error or a security warning added after the page loaded) are caught at
  once and explained, or summarised safely when the sentence is unknown.
- **Listen**: human recordings first, then an optional offline natural voice, then the browser's
  voice. `Alt+Shift+L` reads the page aloud.

## How amounts stay exact

Before any translation, amounts (with their sign), fees, phone and account numbers, references,
dates and beneficiary names are replaced by tokens. After translation they are restored and
checked character for character; any difference blocks the translation. When a sentence is not
known, Langwa does not guess: it says what kind of message it is (error, warning, confirmation)
with validated words and the exact values. Every translation shows whether a native speaker
validated it.

## Install

**Chrome, Edge, Brave, Opera:** download `langwa-chromium.zip` from the website and extract it.
Open `chrome://extensions` (Edge: `edge://extensions`), turn on **Developer mode**, click
**Load unpacked** and choose the extracted folder. From this repository you can also load the
`browser-extension` folder directly.

**Firefox:** `about:debugging` → This Firefox → Load Temporary Add-on → `langwa-firefox.xpi`.

**Phones:** Chrome on Android cannot run extensions. Use Firefox with Tampermonkey (Android) or
the Userscripts app with Safari (iPhone), then install `langwa.user.js` from the website.

**Offline natural voice (optional, computer):** download "Natural voice" from the website,
extract it and double-click **Start Langwa voice**. A progress page opens in the browser; the
first time it downloads about 660 MB once (with a Cancel button), then it starts in about 20
seconds and runs offline. From this repository: `server\start-voice.vbs` (Mac/Linux:
`sh server/start-voice.sh`). Langwa finds it by itself; without it, the browser's voice reads.

Langwa is active by default on `safinum.cm`, `localhost` and `127.0.0.1`. On another site, open
the Langwa button and switch it on.

## Languages and validation

| Language | Status |
|---|---|
| Cameroon Pidgin English (Kamtok) | 202 of 291 sentences, all validated by a native speaker (Buea) |
| Fulfulde (Adamawa) | 111 of 291 sentences; greetings checked by a Fulfulde speaker, the rest labelled "Not validated" |
| Ewondo, Duala, Basaá, Ghomálá', Lamnso', Mankon, Kom | Structure ready; waiting for speakers |

First drafts were written with AI assistance and are labelled "Not validated" until a speaker
approves them. Native speakers translate on the contribution page
(https://langwa-five.vercel.app/contribute/), send their file on WhatsApp, and the team merges
it with `node tools/merge-contributions.mjs <folder>`: markers such as `{amount}` are checked,
validated sentences are never overwritten, and disagreements are listed. A second speaker then
validates each sentence in Langwa's settings. Details are in part 7 of the documentation.

## Repository

```
browser-extension/     the extension (Manifest V3, no dependencies)
  src/protect.js       detects, masks, restores and verifies financial values
  src/engine.js        glossary, templates, message classification, safe summary
  src/assistant.js     questions about the page
  src/speech.js        recordings, offline voice, browser voice
  src/content.js       reading the page, cards, panel, alerts, guided tour
  src/background.js    language packs, voice status, optional local translation
  src/popup.*          language, display mode, on/off for the site
  src/options.*        settings: validation of translations, voice, safety test
  lang/                source sentences (French/English) and one file per language
  tests/               unit tests: node --test tests/
server/                optional offline voice (Africa TTS) and optional local translation servers
tools/build.mjs        builds the extension, the Firefox and phone versions, and the website
tools/build-docs.mjs   builds the documentation PDF; tools/docs-shots.mjs takes its screenshots
tools/merge-contributions.mjs   merges translations received from native speakers
tools/demo/            automated walkthrough recorder and test-page coverage check
collect/               the website, as published
docs/                  documentation, description, screenshots
data/                  dictionary hints for translators (Wiktionary, CC BY-SA)
```

## Build and test

```
node tools/build.mjs              # extension zips, phone userscript, website (Node 18+)
cd browser-extension && node --test tests/
node tools/build-docs.mjs         # documentation PDF
```

## Disclosure

Development used Visual Studio Code, Git and GitHub, Edge and Chrome, Node.js, Python and
ffmpeg. Claude Code (Anthropic), an AI coding assistant, helped write and test the code, the
documentation and the first translation drafts. The optional offline voice uses Africa TTS
(AfriSpeech; model CC-BY-NC-4.0, non-commercial). Online browser voices and spoken questions are
off unless the user turns them on, and are labelled as such. The full list of components and
external services is in part 9 of the documentation.
