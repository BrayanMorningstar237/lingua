# Langwa

Langwa shows digital banking pages in Cameroon's national languages(traditional), without changing the
bank's code. Amounts, fees, beneficiaries, account numbers and references are protected: they
are never translated, never sent anywhere, and every translation is checked against them
before it is shown.

```
browser-extension/        the extension (no build step, no dependencies)
  manifest.json
  src/protect.js          detects and protects financial values, integrity check
  src/engine.js           glossary, templates, "label : value", safe summary
  src/speech.js           listen button: human recordings + exact amounts
  src/content.js          reads the page, Ctrl+hover / long press card, panel, alerts
  src/background.js       language packs, optional local open-source translation and voice
  src/standalone.js       runtime used by the phone version (userscript)
  src/options.*           glossary editor for native speakers (recording, validation, test bench)
  src/popup.*             on/off per site, language, display mode
  lang/source.json        French/English source strings with context notes for translators
  lang/languages.json     supported languages
  lang/<code>.json        translations per language (ewo, fub, dua, bbj, bas)
  icons/                  extension icons
  tests/                  node --test tests/
tools/build.mjs           builds dist/ (zip, xpi, userscript)
server/                   optional local NLLB-200 translation and MMS-TTS voice (Python)
docs/TECHNICAL.md         technical document for the jury
```

## Get it on any browser

Build once: `node tools/build.mjs` (Node 18 or newer). This creates `dist/`.

| Browser | How |
|---|---|
| **Chrome, Edge, Brave, Opera** (computer) | Open `chrome://extensions` (or `edge://extensions`), turn on **Developer mode**, click **Load unpacked**, choose the `browser-extension` folder. To give it to anyone with one click, upload `dist/langwa-chromium.zip` to the Chrome Web Store or Edge Add-ons. |
| **Firefox** (computer) | `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → `browser-extension/manifest.json`. Then in `about:addons` → Langwa → Permissions, allow the sites. For a permanent install, sign `dist/langwa-firefox.xpi` on addons.mozilla.org (free, automated). |
| **Firefox for Android** | Publish the signed xpi on addons.mozilla.org, then install it from there on the phone. |
| **Any phone browser** (Android Chrome, Samsung Internet, iPhone Safari) | These browsers do not run extensions. Install a userscript manager: **Tampermonkey** or **Violentmonkey** (Android), or the free **Userscripts** app (iPhone, Safari). Then open `dist/langwa.user.js` and confirm the install. |
| **Safari** (Mac) | `xcrun safari-web-extension-converter browser-extension/`, then build the generated Xcode project. |

The extension is active on `safinum.cm`, `localhost` and `127.0.0.1` by default. On another
site, click the icon and turn on **Actif sur ce site**. The userscript runs on the same sites;
add others in the userscript manager (User matches).

## Using it

- **Computer:** hold **Ctrl** (Cmd on Mac) and point at any text, paragraph or button. It is outlined and its translation appears just below it. Release Ctrl to click 🔊 and listen.
- **Phone:** **long press** any text. The card appears below it. A long press never activates the bank's button.
- **Panel:** the round button at the bottom right, or `Alt+Shift+M`. The whole page, important messages first. The language can be switched at the top.
- **Subtitles:** the CC button in the panel, or `Alt+Shift+S`.
- **New messages:** any new error, warning or confirmation pops up translated, and is read aloud when a recording exists.
- On first use, a short visual hint shows the gesture.

## Filling in a language (the native speaker's job)

1. Open the extension's options (popup → **Glossaire, voix et paramètres**).
2. Choose the language and type the validator's name.
3. For each line: write the **meaning** (as you would explain it to a relative), tick **Validé**, and record your voice.
   - Context notes under the French text explain what each banking term really means.
   - `{amount}`, `{name}`, `{count}` must stay: the editor refuses to validate otherwise.
   - For sentences with values, record each piece. The real amount and name are read in between.
   - Optional: a one-line explanation of a difficult word. It is shown under the translation.
4. Lines marked **À vérifier sur la vraie page** were copied from an auto-translated view of the test page. Compare them with the real page (browser translation turned off) and fix `lang/source.json` if needed.
5. **Exporter le fichier de langue** → save it as `browser-extension/lang/<code>.json`, then run `node tools/build.mjs`.

The **banc d'essai** (test bench) shows, for any sentence, what is protected, what would leave
the page, the result, the integrity check, and lets you hear it.

## Getting translations from speakers (no install needed)

1. Run `node tools/build.mjs`. It creates `dist/langwa-collect.html`, a one-file contribution page.
2. Send that file on WhatsApp, or host it: with GitHub Pages enabled, it is at `https://<user>.github.io/<repo>/collect/`.
3. The speaker opens it on a phone, chooses the language, and translates one sentence per screen, starting with the test journey. They can record their voice, tap dictionary suggestions, and stop and continue later (everything is saved on the phone).
4. **Envoyer mes traductions** shares a small file directly to WhatsApp (or downloads it).
5. The team opens the glossary editor → **Importer (JSON, CSV)** and selects one or several received files. New translations are added as "Non validé"; validated ones are never overwritten.
6. A second speaker (or the same one, re-reading) ticks **Validé** with their name.

Teams that prefer a spreadsheet can use **Tableur (CSV)** to get every phrase in Google Sheets or Excel, fill the `translation` column, and import the CSV back.

**Dictionary suggestions** come from `node tools/harvest-wiktionary.mjs`, which collects openly licensed terms (Wiktionnaire, CC BY-SA 4.0) into `data/terms.json`. They are hints for speakers, never shown to users as translations.

## Optional local open-source helpers

Without them, sentences that are not in the glossary get a **safe summary**: a validated
sentence for the message type, validated key words, and the exact amounts.

- **Translation:** Ollama with an open model (e.g. `qwen2.5:7b-instruct`, Apache-2.0), started with `OLLAMA_ORIGINS=* ollama serve`; or `python server/nllb_server.py` (NLLB-200, Fulfulde only). Choose it in the options.
- **Voice:** `python server/tts_server.py` (Meta MMS-TTS, Fulfulde only). Other languages use human recordings.

## Tests

```
cd browser-extension
node --test tests/
```
