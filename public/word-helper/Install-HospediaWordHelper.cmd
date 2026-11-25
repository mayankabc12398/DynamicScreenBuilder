@echo off
rem Hospedia Word Helper - run once on each radiology PC (no admin needed).
rem Report Editor then opens the report in MS Word, and Ctrl+S in Word saves it
rem back to Hospedia and closes Word by itself.
rem To remove it: Install-HospediaWordHelper.cmd /uninstall
powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:HWH_ARG='%~1'; $s = Get-Content -LiteralPath '%~f0' -Raw; iex $s.Substring($s.IndexOf('#PS-START'))"
pause
exit /b

#PS-START
$folder = Join-Path $env:LOCALAPPDATA 'Hospedia'
$script = Join-Path $folder 'HospediaWordHelper.ps1'
$key    = 'HKCU:\Software\Classes\hospediaword'

if ($env:HWH_ARG -eq '/uninstall') {
    Remove-Item -Path $key -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $script -Force -ErrorAction SilentlyContinue
    Write-Host 'Hospedia Word Helper removed.'
    return
}

New-Item -ItemType Directory -Force -Path $folder | Out-Null

@'
# Hospedia Word Helper - started by a "hospediaword:<url>" link from Hospedia.
# Opens the report in MS Word; after the first save (Ctrl+S) closes the report,
# and Word too if nothing else is open in it.
param([string]$Link)

$url = $Link -replace '^hospediaword:', ''
if ($url -notmatch '^https?://') { exit 1 }

try {
    $word = [Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')
} catch {
    $word = New-Object -ComObject Word.Application
}
$word.Visible = $true

# FileName, ConfirmConversions, ReadOnly, AddToRecentFiles - kept out of the
# recent list so Word never offers these temporary reports again.
$doc = $word.Documents.Open($url, $false, $false, $false)
try { $doc.Activate(); $word.Activate() } catch { }

$edited = $false
while ($true) {
    Start-Sleep -Milliseconds 700
    try { $saved = $doc.Saved } catch { exit 0 }   # closed by the user

    if (-not $saved) { $edited = $true; continue }
    if (-not $edited) { continue }

    # Saved after an edit: give the upload a moment, then close.
    Start-Sleep -Seconds 2
    try { $doc.Close(0) } catch { }
    try { if ($word.Documents.Count -eq 0) { $word.Quit(0) } } catch { }
    exit 0
}
'@ | Set-Content -LiteralPath $script -Encoding UTF8

New-Item -Path $key -Force | Out-Null
Set-ItemProperty -Path $key -Name '(default)' -Value 'URL:Hospedia Word Helper'
Set-ItemProperty -Path $key -Name 'URL Protocol' -Value ''
New-Item -Path "$key\shell\open\command" -Force | Out-Null
Set-ItemProperty -Path "$key\shell\open\command" -Name '(default)' -Value (
    'powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $script + '" "%1"')

Write-Host 'Hospedia Word Helper installed.'
Write-Host 'The first time, the browser asks to open "hospediaword" links - tick Always allow and Open.'
