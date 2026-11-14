# Automated walkthrough recorder and test-page check

These tools drive a clean Microsoft Edge with the built extension on the SAFINUM test page.
They were used to check the test journey and to make a first draft of the demo; the submitted
video was recorded and edited by the team.

Requires Microsoft Edge, Node 22+, and for the recorder the offline voice running
(`server\start-voice.vbs`) and ffmpeg (`pip install imageio-ffmpeg`).

1. `node tools/build.mjs`, then extract `dist/langwa-chromium.zip` into a folder (EXT).
2. **Test-page coverage.** List every text of the test page left untranslated, at each step,
   French and English pages:
   `node tools/demo/check-test-page.mjs EXT <empty profile dir> wes` (or `fub`).
3. **Walkthrough recording** (setup, Fulfulde, Pidgin, a message added after load, safety test):
   `node tools/demo/record.mjs EXT <empty profile dir> <out dir> <repo>/collect`
4. **Build the mp4** from the recording (and a copy without sound):
   `node tools/demo/make.mjs <out dir> <ffmpeg.exe> demo.mp4 demo-silent.mp4`

The recorder draws its own pointer, captions and chapter labels on top of the pages (they are not
part of Langwa), and shows the real Langwa popup page beside the bank page, since a headless
browser has no toolbar. The new message is added to the page after it has loaded, as the jury
does during a demonstration.
