@echo off
echo 🔪 Force killing Chrome...
taskkill /F /IM chrome.exe /T >nul 2>&1
timeout /t 3 /nobreak >nul

echo 🚀 Starting Chrome (Debug Port 9222)...
set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME_PATH% set CHROME_PATH="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist %CHROME_PATH% set CHROME_PATH="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"

echo Found Chrome at: %CHROME_PATH%
start "" %CHROME_PATH% --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\Google\Chrome\User Data" --no-first-run --no-default-browser-check --restore-last-session

echo ⏳ Waiting 15s for Chrome to load...
timeout /t 15 /nobreak >nul

echo ▶️ Running Generator...
cd /d "%~dp0"
node src\batch_generate.js
