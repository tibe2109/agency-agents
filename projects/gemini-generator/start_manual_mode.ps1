# Interactive Chrome Launcher for Gemini Generator
$ErrorActionPreference = "Continue"

Write-Host "[WELCOME] INTERACTIVE MODE" -ForegroundColor Cyan
Write-Host "CRITICAL REQUIREMENT: To allow the script to type for you, Chrome MUST be restarted in debug mode." -ForegroundColor Yellow
Write-Host "This means ALL existing Chrome windows must be CLOSED FIRST." -ForegroundColor Yellow
Write-Host ""
$response = Read-Host "Do you want me to force close Chrome for you? (REQUIRED for automation) (Y/N)"

if ($response -eq 'Y' -or $response -eq 'y') {
    Write-Host "[KILL] Killing Chrome (Attempt 1)..." -ForegroundColor Red
    Stop-Process -Name "chrome" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "[KILL] Killing Chrome (Attempt 2 - Taskkill)..." -ForegroundColor Red
    cmd /c "taskkill /F /IM chrome.exe /T 2>NUL"
    Start-Sleep -Seconds 2
    
    Write-Host ""
    Write-Host "⚠️ VERIFICATION NEEDED:" -ForegroundColor Yellow
    Write-Host "Please check your Taskbar and Task Manager."
    Write-Host "Ensure there are NO Google Chrome icons or processes left."
    Pause
} else {
    Write-Host "[WARN] You chose NOT to close Chrome." -ForegroundColor Red
    Write-Host "If Chrome is already running without debug mode, the automation WILL FAIL to connect." -ForegroundColor Red
    Write-Host "Please manually close all Chrome windows NOW if you haven't, before proceeding." -ForegroundColor Red
    Pause
}

# 2. Launch Chrome with Debugging Port
$userDataDir = "$env:LOCALAPPDATA\Google\Chrome\User Data"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
    $chromePath = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
}

Write-Host "[LAUNCH] Launching Chrome..." -ForegroundColor Cyan
# Using Start-Process to detach
$processArgs = @(
    "--remote-debugging-port=9222",
    "--user-data-dir=`"$userDataDir`"",
    "--no-first-run",
    "--no-default-browser-check",
    "--restore-last-session",
    "https://gemini.google.com/app"
)
Write-Host "DEBUG: Launching with args: $processArgs" -ForegroundColor Gray
Start-Process -FilePath $chromePath -ArgumentList $processArgs
Start-Sleep -Seconds 3

# Wait for port to open
Write-Host "[CHECK] Verifying debugging port 9222..."
$portOpen = $false
# Check both localhost and 127.0.0.1
if ((Test-NetConnection -ComputerName localhost -Port 9222 -WarningAction SilentlyContinue).TcpTestSucceeded -or
    (Test-NetConnection -ComputerName 127.0.0.1 -Port 9222 -WarningAction SilentlyContinue).TcpTestSucceeded) {
    $portOpen = $true
}

if ($portOpen) {
    Write-Host "✅ PORT 9222 IS OPEN! Automation ready." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ CRITICAL ERROR: Port 9222 is NOT open." -ForegroundColor Red
    Write-Host "This means Chrome is still running a normal window somewhere, blocking debug mode." -ForegroundColor Red
    
    $retry = Read-Host "Do you want me to violently FORCE KILL all Chrome processes and try again? (Y/N)"
    if ($retry -eq 'Y' -or $retry -eq 'y') {
        Write-Host "[KILL] EXECUTING FORCE KILL..." -ForegroundColor Red
        cmd /c "taskkill /F /IM chrome.exe /T 2>NUL"
        Start-Sleep -Seconds 2
        
        Write-Host "[LAUNCH] Relaunching Chrome in Debug Mode..."
        Start-Process -FilePath $chromePath -ArgumentList $processArgs
        Start-Sleep -Seconds 3
    } else {
        Write-Host "Proceeding, but connection will likely fail..." -ForegroundColor DarkYellow
    }
}

Write-Host ""
Write-Host "[ACTION REQUIRED]:" -ForegroundColor Green
Write-Host "1. Chrome should have opened."
Write-Host "   (If not, please check if you see a 'Chrome is being controlled' banner at the top of the browser)"
Write-Host "2. Please LOGIN to your Google account or ensure you are logged in."
Write-Host "3. Ensure you are on the Gemini chat screen."
Write-Host "4. Come back here and press ENTER to start the automation."
Write-Host ""
Pause

# 3. Start the Generator
Write-Host "[START] Starting TEST MODE (Checking input typing)..." -ForegroundColor Cyan
Write-Host "Please ensure you have clicked inside the Gemini input box at least once to ensure focus." -ForegroundColor Cyan
# node projects/gemini-generator/src/batch_generate.js
node projects/gemini-generator/src/test_typing.js

Write-Host "[DONE] Test finished! Check if you see typing in the browser." -ForegroundColor Green
Pause