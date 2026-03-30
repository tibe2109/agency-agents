$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$lastProfileFile = Join-Path $scriptDir ".last_gemini_profile.txt"

$defaultSlot = "gemini_profile_data"
$existingSlots = Get-ChildItem -Path $scriptDir -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "gemini_profile_data*" } |
    Select-Object -ExpandProperty Name

# Prefer last used profile; fallback to newest profile folder if available.
if (Test-Path $lastProfileFile) {
    $lastUsed = (Get-Content -Path $lastProfileFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
    if (-not [string]::IsNullOrWhiteSpace($lastUsed)) {
        $defaultSlot = $lastUsed
    }
} elseif ($existingSlots) {
    $newest = Get-ChildItem -Path $scriptDir -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "gemini_profile_data*" } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if ($newest) {
        $defaultSlot = $newest.Name
    }
}

Write-Host "[RUN BATCH] Use saved Gemini login profile"
if ($existingSlots) {
    Write-Host "Available profiles:"
    $existingSlots | ForEach-Object { Write-Host " - $_" }
}

$slotName = Read-Host "Profile name (Enter for '$defaultSlot')"
if ([string]::IsNullOrWhiteSpace($slotName)) {
    $slotName = $defaultSlot
}

if (-not (Test-Path (Join-Path $scriptDir $slotName))) {
    Write-Host "Profile '$slotName' does not exist." -ForegroundColor Red
    Write-Host "Run setup first: powershell -ExecutionPolicy Bypass -File .\setup_login_profile.ps1" -ForegroundColor Yellow
    exit 1
}

Set-Content -Path $lastProfileFile -Value $slotName -Encoding ASCII

Set-Item -Path Env:GEMINI_PROFILE_NAME -Value $slotName
Set-Item -Path Env:GEMINI_DISABLE_CDP -Value "0"
Set-Item -Path Env:GEMINI_FORCE_CDP -Value "1"

$relaunchChrome = Read-Host "Relaunch Chrome for batch now? (Y/N, default N)"

if ($relaunchChrome -eq 'Y' -or $relaunchChrome -eq 'y') {
    Write-Host "Closing Chrome to relaunch a fresh batch session..."
    cmd /c "taskkill /F /IM chrome.exe /T 2>NUL"
    Start-Sleep -Seconds 2

    $chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
    if (-not (Test-Path $chromePath)) {
        $chromePath = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
    }

    $userDataDir = Join-Path $scriptDir $slotName
    $geminiUrl = "https://gemini.google.com/app"
    $chromeArgs = "--remote-debugging-port=9222 --user-data-dir=`"$userDataDir`" --no-first-run --no-default-browser-check --disable-sync --disable-features=ChromeSigninIntercept,SigninPromo $geminiUrl"

    Write-Host "Launching Chrome in CDP mode with selected profile..."
    Start-Process -FilePath $chromePath -ArgumentList $chromeArgs
} else {
    Write-Host "Reusing currently opened Chrome session (recommended)."
}

# Wait for CDP endpoint to become available.
$cdpReady = $false
for ($i = 1; $i -le 15; $i++) {
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:9222/json/version" -TimeoutSec 2
        if ($resp.webSocketDebuggerUrl) {
            $cdpReady = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $cdpReady) {
    Write-Host "CDP port 9222 is not ready." -ForegroundColor Red
    Write-Host "Run setup first and KEEP Chrome opened: powershell -ExecutionPolicy Bypass -File .\setup_login_profile.ps1" -ForegroundColor Yellow
    exit 1
}

Push-Location $scriptDir
node src/check_login.js
$checkCode = $LASTEXITCODE
if ($checkCode -ne 0) {
    Pop-Location
    Write-Host "Login is not valid for profile '$slotName'." -ForegroundColor Red
    Write-Host "Run setup first: powershell -ExecutionPolicy Bypass -File .\setup_login_profile.ps1" -ForegroundColor Yellow
    Write-Host "If Google shows 'This browser or app may not be secure', do login only in setup_login_profile.ps1 (normal Chrome)." -ForegroundColor Yellow
    exit $checkCode
}

node src/batch_generate.js
$batchCode = $LASTEXITCODE
Pop-Location

exit $batchCode
