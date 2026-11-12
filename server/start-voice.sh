#!/bin/sh
# Langwa natural voice (macOS / Linux): run  sh server/start-voice.sh
# Nothing needs to be installed first. First time only (about 700 MB, resumes if interrupted):
# a private Python (via uv, open source) if needed, then Africa TTS and the voice model, all
# inside this Langwa folder. Live progress shows here and in Langwa's settings.
set -e
cd "$(dirname "$0")/.."
ROOT=$(pwd)
UV_VER=0.8.0
MODELS="$ROOT/server/models"
UV="$MODELS/tools/uv"
export UV_PYTHON_INSTALL_DIR="$MODELS/python"
export UV_NO_CACHE=1
PY=.venv/bin/python

fail() { echo "[Langwa] Something went wrong, usually the internet connection. Run this again: it continues where it stopped."; exit 1; }

if curl -s -m 2 -o /dev/null http://127.0.0.1:8770/health; then
  echo "[Langwa] The voice is already running."; exit 0
fi

if [ ! -f .venv/.langwa-voice-ready ]; then
  echo "Langwa voice: first start, only once. Text translation already works; the voice is ready in 10 to 30 minutes."
  if [ ! -x "$UV" ]; then
    case "$(uname -s)-$(uname -m)" in
      Darwin-arm64) T=aarch64-apple-darwin ;;
      Darwin-*) T=x86_64-apple-darwin ;;
      Linux-aarch64|Linux-arm64) T=aarch64-unknown-linux-gnu ;;
      *) T=x86_64-unknown-linux-gnu ;;
    esac
    echo "[Langwa] Getting the installer, about 20 MB..."
    mkdir -p "$MODELS/tools"
    curl -L -# --retry 5 "https://github.com/astral-sh/uv/releases/download/$UV_VER/uv-$T.tar.gz" | tar -xz -C "$MODELS/tools" --strip-components=1 || fail
  fi
  if [ ! -x "$PY" ]; then
    echo "[Langwa] Preparing Python inside the Langwa folder, about 20 MB..."
    "$UV" venv -q --seed --python 3.12 .venv || fail
  fi
fi
# Installs what is missing with live progress, then runs the voice. Keep this window open.
exec "$PY" -u server/voice_setup.py --uv "$UV"
