@echo off
setlocal
title Langwa Lamnso translation
rem Langwa Lamnso' translation: corpus retrieval (port 8769) + a small local model (port 8771).
rem First run downloads llama.cpp (about 20 MB) and Qwen2.5 1.5B Instruct (about 1.1 GB, Apache-2.0).
rem Everything runs on this computer. Keep this window open while you use Lamnso.
cd /d "%~dp0\.."

set "LLAMA_TAG=b12317"
set "LLAMA_DIR=server\models\llama.cpp"
set "MODEL=server\models\llm\qwen2.5-1.5b-instruct-q4_k_m.gguf"
set "MODEL_URL=https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf"

set "PY=.venv\Scripts\python.exe"
if not exist "%PY%" set "PY=py -3"

if not exist "data\nso-corpus\lamnso_english_erv.csv" (
  echo [Langwa] Fetching the Lamnso parallel corpus once...
  if not exist "data\africa-corpus-builder\africa_corpus.py" git clone --depth 1 https://github.com/AfriSpeech/africa-corpus-builder data\africa-corpus-builder
  %PY% tools\fetch-lamnso-corpus.py || (pause & exit /b 1)
)

if not exist "%LLAMA_DIR%\llama-server.exe" (
  echo [Langwa] Downloading llama.cpp %LLAMA_TAG% for CPU, about 20 MB...
  if not exist "%LLAMA_DIR%" mkdir "%LLAMA_DIR%"
  "%SystemRoot%\System32\curl.exe" -L --retry 5 -o "%LLAMA_DIR%\llama.zip" "https://github.com/ggml-org/llama.cpp/releases/download/%LLAMA_TAG%/llama-%LLAMA_TAG%-bin-win-cpu-x64.zip" || (pause & exit /b 1)
  "%SystemRoot%\System32\tar.exe" -xf "%LLAMA_DIR%\llama.zip" -C "%LLAMA_DIR%" || (pause & exit /b 1)
  del "%LLAMA_DIR%\llama.zip"
)

if not exist "%MODEL%" (
  echo [Langwa] Downloading the model once, about 1.1 GB. The download resumes if interrupted.
  if not exist "server\models\llm" mkdir "server\models\llm"
  "%SystemRoot%\System32\curl.exe" -L -C - --retry 20 --retry-all-errors --retry-delay 3 -o "%MODEL%.part" "%MODEL_URL%" || (pause & exit /b 1)
  move /y "%MODEL%.part" "%MODEL%" >nul
)

echo [Langwa] Starting the Lamnso corpus service (minimised window)...
start "Langwa Lamnso corpus" /min %PY% -u server\lamnso_corpus_server.py

echo [Langwa] Starting the Lamnso model on http://127.0.0.1:8771 (CPU, about 1.2 GB of RAM).
rem Small context, one request at a time, memory-mapped weights: light on an 8 GB laptop.
"%LLAMA_DIR%\llama-server.exe" -m "%MODEL%" --host 127.0.0.1 --port 8771 --alias lamnso -c 2048 --parallel 1 -t 4 -ngl 0 --no-webui
pause
