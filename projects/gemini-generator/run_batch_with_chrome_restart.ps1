Write-Host "🔪 Killing ALL Chrome processes..."
taskkill /F /IM chrome.exe /T 2>$null
Start-Sleep -Seconds 3

$userDataDir = "$env:LOCALAPPDATA\Google\Chrome\User Data"
Write-Host "📂 User Data Dir: $userDataDir"

# Try to find Chrome
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
    $chromePath = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
}
if (-not (Test-Path $chromePath)) {
    $chromePath = "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
}

if (-not (Test-Path $chromePath)) {
    Write-Error "❌ Chrome not found!"
    exit 1
}

Write-Host "🚀 Starting Chrome in Debug Mode (Port 9222)..."
Write-Host "   Path: $chromePath"

# Start Chrome detached
# Ensure arguments are quoted correctly for spaces in path
$quotedUserDataDir = "`"$userDataDir`""
Start-Process -FilePath $chromePath -ArgumentList "--remote-debugging-port=9222", "--user-data-dir=$quotedUserDataDir", "--no-first-run", "--no-default-browser-check", "--restore-last-session"

Write-Host "⏳ Waiting for Chrome to initialize (15s)..."
Start-Sleep -Seconds 15

Write-Host "▶️ Running Batch Generator..."
node projects/gemini-generator/src/batch_generate.js
