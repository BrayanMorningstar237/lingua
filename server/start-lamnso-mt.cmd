@echo off
setlocal
rem Langwa Lamnso' local translation server.
rem Start this when using Nso translations; keep this window open.
cd /d "%~dp0\.."

if not exist ".venv\Scripts\python.exe" (
  echo [Langwa] Creating the Python environment...
  py -3 -m venv .venv 2>nul || python -m venv .venv
  if not exist ".venv\Scripts\python.exe" (
    echo [Langwa] Python 3.10 or newer is required.
    pause
    exit /b 1
  )
)

".venv\Scripts\python.exe" -c "import ctranslate2, transformers, huggingface_hub" 2>nul || (
  echo [Langwa] Installing the Lamnso translation dependencies...
  ".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r server\requirements-cameroon-mt.txt || (pause & exit /b 1)
)

echo [Langwa] Starting the local Lamnso translation server. Keep this window open.
".venv\Scripts\python.exe" -u server\cameroon_mt_server.py
pause
