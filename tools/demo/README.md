# Demo video and test-page check (reproducible)

Requires Microsoft Edge, Node 22+, the offline voice running (`server\start-voice.cmd`) and
ffmpeg (`.venv\Scripts\python.exe -m pip install imageio-ffmpeg`).

1. `node tools/build.mjs`, then unzip `dist/langwa-chromium.zip` into a folder (EXT).
2. Check every step of the SAFINUM test page for untranslated text, French and English pages:
   `node tools/demo/check-test-page.mjs EXT <empty profile dir> wes` (or `fub`).
3. Record the demo, driven in a clean Edge profile:
   `node tools/demo/record.mjs EXT <empty profile dir> <out dir> <repo>/collect` (one film: setup, Fulfulde, Pidgin, under 3 minutes)
4. Build the mp4 (and a silent copy for a human narrator):
   `node tools/demo/make.mjs <out dir> <ffmpeg.exe> demo.mp4 demo-silent.mp4`

Narration and national-language audio come from the offline voice; the new message in the
demo is injected after the page has loaded, as the jury does.
