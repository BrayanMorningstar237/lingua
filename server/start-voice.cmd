@echo off
setlocal
rem "--hidden": started by start-voice.vbs (no window, no questions, no pause; output goes to a log).
set "HIDDEN="
if /i "%~1"=="--hidden" set "HIDDEN=1"
rem Windows Terminal (the default on Windows 11) can crash and close the voice with it:
rem reopen in the classic Windows console, which is stable.
if not defined HIDDEN if defined WT_SESSION if not defined LANGWA_CONSOLE (
  set "LANGWA_CONSOLE=1"
  start "Langwa voice" "%SystemRoot%\System32\conhost.exe" cmd /c ""%~f0""
  exit /b 0
)
title Langwa voice
rem Langwa natural voice: double-click to start. Nothing else needs to be installed first.
rem First time only (about 700 MB, resumes if the connection drops): a private Python (via uv,
rem open source) if the computer has none, then Africa TTS and the voice model, all inside this
rem Langwa folder. Live progress shows here and in Langwa's settings. Next times: about 20 seconds.
rem To remove everything: delete the Langwa folder (and "Langwa voice" in Win+R, shell:startup).
cd /d "%~dp0\.."

set "UV_VER=0.8.0"
set "UV_ARCH=x86_64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "UV_ARCH=aarch64"
set "MODELS=%CD%\server\models"
set "UV=%MODELS%\tools\uv.exe"
set "UV_PYTHON_INSTALL_DIR=%MODELS%\python"
set "UV_NO_CACHE=1"
set "PY=.venv\Scripts\python.exe"
set "CURL=%SystemRoot%\System32\curl.exe"
set "TAR=%SystemRoot%\System32\tar.exe"

rem Already running (for example started with the computer)? Then there is nothing to do.
"%CURL%" -s -m 2 -o nul http://127.0.0.1:8770/health && (
  echo [Langwa] The voice is already running. / La voix est deja en marche.
  if defined HIDDEN exit /b 3
  timeout /t 4 >nul
  exit /b 0
)

if exist ".venv\.langwa-voice-ready" if exist "%MODELS%\africa-tts\voices\voices.json" goto run

echo.
echo   Langwa voice - first start, only once. / Premier demarrage, une seule fois.
echo   Text translation already works in Langwa; the voice is ready in 10 to 30 minutes.
echo   La traduction du texte marche deja ; la voix sera prete dans 10 a 30 minutes.
echo.

if not exist "%MODELS%" mkdir "%MODELS%"
if defined HIDDEN goto prepare
if exist "%MODELS%\.autostart-asked" goto prepare
type nul > "%MODELS%\.autostart-asked"
choice /c YN /n /m "Start the voice by itself when this computer starts? / Demarrer la voix avec l'ordinateur ? [Y/N] "
if errorlevel 2 goto prepare
> "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Langwa voice.cmd" echo @start "Langwa voice" /min "%%SystemRoot%%\System32\conhost.exe" cmd /c ""%~dp0start-voice.cmd""
echo [Langwa] OK. To undo: Win+R, type shell:startup, delete "Langwa voice".
echo.

:prepare
if exist ".venv\.langwa-voice-ready" goto run
if exist "%UV%" goto haveuv
echo [Langwa] Getting the installer, about 20 MB...
if not exist "%MODELS%\tools" mkdir "%MODELS%\tools"
"%CURL%" -L -s -S --retry 5 -o "%MODELS%\tools\uv.zip" "https://github.com/astral-sh/uv/releases/download/%UV_VER%/uv-%UV_ARCH%-pc-windows-msvc.zip" || goto fail
"%TAR%" -xf "%MODELS%\tools\uv.zip" -C "%MODELS%\tools" || goto fail
del "%MODELS%\tools\uv.zip"
:haveuv
if exist "%PY%" goto run
echo [Langwa] Preparing Python inside the Langwa folder, about 20 MB...
"%UV%" venv -q --seed --python 3.12 .venv || goto fail

:run
rem Installs what is missing with live progress, then runs the voice. Keep this window open.
"%PY%" -u server\voice_setup.py --uv "%UV%" || goto fail
if not defined HIDDEN pause
exit /b 0

:fail
echo.
echo [Langwa] Something went wrong, usually the internet connection.
echo          Double-click start-voice.cmd again: it continues where it stopped.
echo [Langwa] Un probleme est survenu, souvent la connexion. Relancez start-voice.cmd : il reprend ou il s'est arrete.
if not defined HIDDEN pause
exit /b 1
