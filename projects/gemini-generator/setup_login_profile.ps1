$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$lastProfileFile = Join-Path $scriptDir ".last_gemini_profile.txt"

$defaultSlot = "gemini_profile_data"
$existingSlots = Get-ChildItem -Path $scriptDir -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "gemini_profile_data*" } |
    Select-Object -ExpandProperty Name

Write-Host "[LOGIN SETUP] Configure Gemini login profile"
if ($existingSlots) {
    Write-Host "Existing profiles:"
    $existingSlots | ForEach-Object { Write-Host " - $_" }
}

$createFresh = Read-Host "Create a NEW clean profile now? (Y/N, default Y)"
if ([string]::IsNullOrWhiteSpace($createFresh) -or $createFresh -eq 'Y' -or $createFresh -eq 'y') {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $slotName = "gemini_profile_data_$timestamp"
    Write-Host "Created profile name: $slotName"
} else {
    $slotName = Read-Host "Profile name to reuse (Enter for '$defaultSlot')"
    if ([string]::IsNullOrWhiteSpace($slotName)) {
        $slotName = $defaultSlot
    }
}

Set-Item -Path Env:GEMINI_PROFILE_NAME -Value $slotName
Set-Item -Path Env:GEMINI_DISABLE_CDP -Value "1"

Write-Host "Using profile: $slotName"
Write-Host "Opening NORMAL Chrome for one-time login (no automation)..."

$userDataDir = Join-Path $scriptDir $slotName
New-Item -ItemType Directory -Force -Path $userDataDir | Out-Null
Set-Content -Path $lastProfileFile -Value $slotName -Encoding ASCII

$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
    $chromePath = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
}

$loginUrl = "https://gemini.google.com/app"
$args = "--remote-debugging-port=9222 --user-data-dir=`"$userDataDir`" --no-first-run --no-default-browser-check $loginUrl"
Start-Process -FilePath $chromePath -ArgumentList $args

Write-Host ""
Write-Host "1) Login to Google in the opened Chrome window"
Write-Host "2) Open Gemini and verify you are logged in"
Write-Host "3) If you see 'Request canceled', close Chrome and rerun setup with a NEW clean profile"
Write-Host "4) If Chrome asks to 'Sign in to Chrome/Sync', choose 'No thanks'"
Write-Host "5) KEEP this Chrome window open (important)"
Read-Host "Press ENTER here after login is done (keep Chrome open)"

Write-Host "Login setup completed successfully for profile '$slotName'." -ForegroundColor Green
