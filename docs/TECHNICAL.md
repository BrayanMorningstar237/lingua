# Langwa: technical document

SAFINUM Innovate Challenge, preselection.

## 1. Problem and solution

Banking and mobile-money interfaces in Cameroon are in French or English. Many users read or
speak a national language more comfortably. Langwa works on top of an **unchanged**
financial service and makes its interface understandable in a national language, in writing
and by voice. Every amount, fee, beneficiary, reference and security warning stays exactly as
the bank displays it.

It runs as a browser extension on computers (Chrome, Edge, Brave, Opera, Firefox, Safari) and
as a userscript on phones (Android and iPhone), from the same code.

## 2. Architecture

```
 Bank web page (unchanged)
        │  read-only: text, labels, placeholders, buttons
        ▼
 content.js ── MutationObserver (new content, coalesced, idle time) ──┐
        │                                                             │
        ▼                                                             │
 engine.js  plan(text)                                                │
   1. protect.js mask: amounts with sign, phones, account numbers, references,
      dates, beneficiary names, values typed by the user  →  ⟦A⟧ ⟦B⟧ …
   2. glossary and templates validated by native speakers
   3. "Label : value": translate the label, keep the value verbatim
   4. optional local open-source MT (masked text only, localhost only)
   5. safe summary: validated "message type" sentence + validated key words + exact values
   6. protect.js verify: every protected value present, no new digit, else blocked
        │
        ▼
 Shadow DOM layer, isolated from the page:
   Ctrl+hover card (computer) / long-press card (phone), reading panel,
   alerts for new messages, subtitles, listen button (speech.js)
```

| File | Role |
|---|---|
| `src/protect.js` | Detection, masking, restoring and integrity check of financial values |
| `src/engine.js` | Glossary and template matching, label/value split, message classification, safe summary, speech plan |
| `src/speech.js` | Plays human recordings and reads protected values exactly |
| `src/content.js` | Text collection, display layer, gestures, panel, alerts, lifecycle |
| `src/background.js` | Language packs, optional local MT and voice adapters, cache |
| `src/standalone.js` | Replaces the extension APIs when running as a phone userscript |
| `src/options.*` | Glossary editor: translation, explanation, validation, recording, import/export, test bench |
| `lang/source.json` | 124 source strings (FR/EN) with context notes: the full test journey, common banking errors and warnings, safe-summary sentences, interface strings |

## 3. Integration and independence from the target service

- **No change to the service.** The bank's text, attributes, styles, form values and network
  requests are never modified. Everything is drawn in one Shadow DOM element. Disabling the
  extension leaves the page exactly as it was.
- **Generic.** No selector or code is specific to one bank. Text is grouped by the browser's
  computed layout, so the same code works on any website. It is activated per site.
- **Dynamic pages.** Step changes in a single-page app, error messages and content added by
  the jury are picked up automatically.
- **Portable.** One Manifest V3 package for Chromium browsers and Firefox (desktop and
  Android); Safari through Apple's converter; a userscript build for phone browsers that do not
  support extensions. `node tools/build.mjs` produces all of them with no dependencies.

## 4. Security and preservation of financial information

| Risk | Measure |
|---|---|
| A translation changes an amount, fee or number | Values are replaced by tokens **before** any translation step and restored after. `verify()` requires every original value, character for character, and rejects any extra digit. On failure the translation is blocked and a safe summary or the original text is shown. |
| A lost sign turns a debit into a credit | The sign is part of the protected amount (`-12,500 FCFA`, `+180,000 FCFA`). Unit test included. |
| Beneficiary name altered | Names after "à / to / pour / vers", values next to a label, and values typed by the user are kept verbatim. Standalone proper names are never translated. |
| A gesture triggers a bank action | On phones, the click that follows a long press is cancelled, so a long press on "Confirm" never confirms. |
| Personal data leaving the device | The glossary works offline. The optional MT receives only masked text (`Vous allez envoyer ⟦A⟧ à ⟦B⟧.`) and only on `localhost`. Typed values are kept in memory for the page session only. No analytics. |
| Wrong meaning in a warning | Warnings and errors are detected, shown first and pushed as alerts. A sentence that is not in the glossary is never guessed: it gets a validated "security warning: read carefully" sentence plus validated key words. |
| Partial audio changes the meaning | The listen button only plays when every part of the sentence is recorded. It never plays half a sentence (a missing "never" would reverse it). |
| Injection from page text | Page text is inserted with `textContent` only, never as HTML. |
| Permissions | `storage`, `activeTab`, `localhost` hosts only. No listener or observer runs on sites that are not enabled. |

Every translation carries a status: *validated*, *automatic translation*, *safe summary* or
*blocked*. The original text and the protected values (locked chips) are always shown with it.

## 5. Adaptation to new content

1. The observer detects the new message. Errors, warnings and confirmations appear as an
   alert marked **NEW** and are read aloud when a recording exists.
2. If it matches a template (`Il vous reste {count} tentatives`), it is translated with the new values.
3. If not, the optional local MT translates the masked text, which then goes through the integrity check.
4. Otherwise the safe summary is shown, for example: *[validated: "This is an error message.
   The operation did not go through."] Key words: [Error] · [Balance] · 30 000 FCFA*.

The test bench in the options page shows each step for any sentence typed during the demo.

## 6. Accessibility and user experience

- **No explanation needed.** One gesture: Ctrl + point on a computer, long press on a phone.
  A visual hint shows it once. The card opens right under the element, with an arrow.
- **Listening.** National-language text is played from **recordings by the native speaker**:
  a human voice, not a synthetic one. Amounts and names are read exactly by the most natural
  French voice of the device (amounts are commonly spoken in French in Cameroon). For template
  sentences, each recorded piece is chained with the real values.
- **Meaning, not words.** Translators are asked to write the idea as they would explain it to
  a relative, with context notes for each financial term. An optional one-line explanation
  (for example what "fees" means) is shown under the translation.
- **Interface in the user's language.** The extension's own labels are glossary entries too.
- **Visual language.** Colour and icon carry the meaning before the words: terracotta for
  errors, gold for warnings, green for validated, indigo for information, a lock on protected
  values. Contrast meets WCAG AA. Keyboard and screen readers are supported (focus states,
  ARIA labels, live region for alerts). Reduced-motion settings are respected.
- **Phones.** The panel becomes a full-width bottom sheet with large touch targets.

## 7. Performance

- No dependencies. 98 KB for the userscript, 150 KB for the extension package.
- One scan per burst of page changes, run when the browser is idle, never in a hidden tab.
  Ignored parts of the page (scripts, styles, code) are skipped in one step. Scan time is
  shown in the panel status tooltip.
- Weak references to page elements, bounded caches, translations computed once per sentence.
- Nothing runs on sites where the extension is off.

## 8. Languages and validation method

Supported structure: Ewondo (`ewo`), Fulfulde (`fub`), Duala (`dua`), Ghomálá' (`bbj`),
Basaá (`bas`). Adding a language means one line in `lang/languages.json` and one JSON file.

Validation method:
1. A native speaker writes each translation in the glossary editor, in the standard orthography
   (General Alphabet of Cameroon Languages), guided by the context note of each term.
2. Each entry is validated individually. The validator's name and the date are stored with the
   entry and exported in the language file.
3. Placeholders (`{amount}`, `{name}`) are checked mechanically: a translation that drops or adds
   one cannot be validated.
4. The same speaker records the audio. Changing a text deletes its recordings, so audio and text
   always match.
5. Machine output is never marked as validated and always carries a warning status.

## 9. Main dependencies (all disclosed)

| Component | Use | Licence |
|---|---|---|
| Browser WebExtension APIs | Runtime | Built into the browser |
| Vanilla JavaScript, no npm packages | Extension and userscript | Our code |
| Icon shapes in the style of Lucide | Interface icons | ISC |
| Node.js `node:test` | Unit tests and build | MIT |
| Optional: Ollama + an open model (e.g. Qwen2.5) | Local MT fallback | MIT / Apache-2.0 |
| Optional: Meta NLLB-200 distilled 600M, Transformers, PyTorch | Local MT for Fulfulde | Weights CC-BY-NC-4.0; libraries Apache-2.0 / BSD |
| Optional: Meta MMS-TTS (`facebook/mms-tts-ful`) | Local voice for Fulfulde | Weights CC-BY-NC-4.0 |
| Optional: Africa TTS 0.5 (AfriSpeech, built on Kyutai Pocket TTS, ~100M parameters) | Local natural voice for Ewondo, Duala, Basaá, Pidgin; experimental for the others | Weights CC-BY-NC-4.0; code MIT |

## 10. Known limitations

- Translation quality depends on the glossary. Open machine translation for Ewondo, Duala,
  Ghomálá' and Basaá is weak or does not exist, which is why the safe summary exists. NLLB covers
  Nigerian Fulfulde, which differs from Adamawa Fulfulde.
- Detection rules cover common Cameroonian formats (FCFA, +237 numbers, CM account numbers).
  Other formats can be added as rules.
- Pages drawn on `<canvas>`, inside cross-origin iframes, or in closed Shadow DOM cannot be read.
  Text inside images is not handled.
- The phone version has no glossary editor: translations are prepared on a computer and built
  into the userscript.
- The optional Africa TTS voice is trained for Ewondo, Duala, Basaá and English (used for Pidgin).
  Fulfulde, Ghomálá', Ngemba and Kom are experimental and borrow the closest trained voice, so
  pronunciation varies. It needs a one-time 440 MB download. Until the server is ready, or if a
  phrase takes too long, Langwa reads with the browser's voice instead, so the user never waits.
- The model weights of NLLB-200, MMS-TTS and Africa TTS are non-commercial (CC-BY-NC-4.0).
