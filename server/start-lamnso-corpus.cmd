@echo off
title Langwa Lamnso corpus retrieval
cd /d "%~dp0\.."
if not exist ".venv\Scripts\python.exe" (
  echo [Langwa] Create the project Python environment first.
  pause
  exit /b 1
)
if not exist "data\nso-corpus\lamnso_english_erv.csv" (
  echo [Langwa] Fetch the corpus first: .venv\Scripts\python.exe tools\fetch-lamnso-corpus.py
  pause
  exit /b 1
)
echo [Langwa] Starting Lamnso corpus retrieval on port 8769. Keep this window open.
".venv\Scripts\python.exe" -u server\lamnso_corpus_server.py
pause
