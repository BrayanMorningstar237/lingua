# Langwa: technical document

The full technical document is **[Langwa-Documentation.pdf](Langwa-Documentation.pdf)** (14 pages,
with screenshots). It covers, as section 6 of the SAFINUM Innovate Challenge asks:

| Part | Content |
|---|---|
| 1 | Brief description (also in [DESCRIPTION.md](DESCRIPTION.md)) |
| 2 | Architecture: collect, protect, translate, verify, show and speak; the role of each file |
| 3 | Integration approach and independence from the target service |
| 4 | Security and preservation of financial information |
| 5 | Adaptation to new content |
| 6 | Accessibility and user experience |
| 7 | National languages supported, coverage (computed from the language files) and validation method |
| 8 | Installation and test for the jury |
| 9 | Main dependencies, external services and disclosure |
| 10 | Known limitations |

## Sources

- The PDF is built from [documentation.template.html](documentation.template.html) and
  [submission.json](submission.json): `node tools/build-docs.mjs`. Coverage figures are
  computed from `browser-extension/lang/*.json` at build time, never typed by hand.
- The screenshots in [screenshots/](screenshots/) are taken from the real extension on the
  SAFINUM test page: `node tools/docs-shots.mjs <unzipped extension> <empty profile>`.
- The demo video is reproducible: see [../tools/demo/README.md](../tools/demo/README.md).
- Contributions received on WhatsApp are merged with `node tools/merge-contributions.mjs <folder>`.
