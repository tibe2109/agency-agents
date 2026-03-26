$ErrorActionPreference = "Stop"

Write-Host "🔪 Killing ALL Chrome processes..." -ForegroundColor Yellow
Stop-Process -Name "chrome" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Verify they are gone
$procs = Get-Process -Name "chrome" -ErrorAction SilentlyContinue
if ($procs) {
    Write-Host "❌ Failed to kill Chrome processes. Attempting taskkill..." -ForegroundColor Red
    taskkill /F /IM chrome.exe /T
    Start-Sleep -Seconds 3
}

$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$userDataDir = "$env:LOCALAPPDATA\Google\Chrome\User Data"

# Start Chrome with Debugging
Write-Host "🚀 Starting Chrome with Debug Port 9222..." -ForegroundColor Cyan
# Quote the path strictly for ArgumentList
$quotedUserData = "`"$userDataDir`""
$processArgs = @(
    "--remote-debugging-port=9222",
    "--user-data-dir=$quotedUserData",
    "--no-first-run",
    "--no-default-browser-check",
    "--restore-last-session"
)
# For debugging, print the command
Write-Host "   Command: $chromePath $processArgs"
Start-Process -FilePath $chromePath -ArgumentList $processArgs
Start-Sleep -Seconds 15

# Check Port
Write-Host "🔌 Checking if Port 9222 is open..." -ForegroundColor Cyan
try {
    $conn = Test-NetConnection -ComputerName localhost -Port 9222 -WarningAction SilentlyContinue
    if ($conn.TcpTestSucceeded) {
        Write-Host "✅ Chrome Debug Port 9222 is OPEN!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Port 9222 is NOT active. Chrome might not have started with debugging." -ForegroundColor Yellow
        # We will try running anyway, maybe it just needs more time?
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host "⚠️ Could not test connection."
}

# Run the Batch Script
Write-Host "▶️ Running Node.js Generation Script..." -ForegroundColor Cyan
node projects/gemini-generator/src/batch_generate.js