# Coastal Banking - Windows Installer
# Run this script with: powershell -ExecutionPolicy Bypass -File Install-CoastalBanking.ps1

$AppName = "Coastal Banking"
$ExeName = "CoastalBanking.exe"
$Publisher = "Coastal Auto Tech"
$Version = "1.0.0"

# Installation paths
$InstallDir = "$env:LOCALAPPDATA\CoastalBanking"
$DesktopShortcut = "$env:USERPROFILE\Desktop\$AppName.lnk"
$StartMenuDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\$Publisher"
$StartMenuShortcut = "$StartMenuDir\$AppName.lnk"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  $AppName Installer v$Version" -ForegroundColor Cyan
Write-Host "  by $Publisher" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if exe exists in same directory as script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceExe = Join-Path $ScriptDir $ExeName

if (-not (Test-Path $SourceExe)) {
    Write-Host "ERROR: $ExeName not found in $ScriptDir" -ForegroundColor Red
    Write-Host "Please place this installer script in the same folder as $ExeName" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Installing $AppName..." -ForegroundColor Green

# Create installation directory
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Host "  Created: $InstallDir" -ForegroundColor Gray
}

# Copy executable
Copy-Item $SourceExe -Destination "$InstallDir\$ExeName" -Force
Write-Host "  Copied application files" -ForegroundColor Gray

# Create Desktop shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($DesktopShortcut)
$Shortcut.TargetPath = "$InstallDir\$ExeName"
$Shortcut.WorkingDirectory = $InstallDir
$Shortcut.Description = $AppName
$Shortcut.Save()
Write-Host "  Created Desktop shortcut" -ForegroundColor Gray

# Create Start Menu shortcut
if (-not (Test-Path $StartMenuDir)) {
    New-Item -ItemType Directory -Path $StartMenuDir -Force | Out-Null
}
$Shortcut = $WshShell.CreateShortcut($StartMenuShortcut)
$Shortcut.TargetPath = "$InstallDir\$ExeName"
$Shortcut.WorkingDirectory = $InstallDir
$Shortcut.Description = $AppName
$Shortcut.Save()
Write-Host "  Created Start Menu shortcut" -ForegroundColor Gray

# Create uninstaller info in registry (for Add/Remove Programs)
$UninstallKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$AppName"
New-Item -Path $UninstallKey -Force | Out-Null
Set-ItemProperty -Path $UninstallKey -Name "DisplayName" -Value $AppName
Set-ItemProperty -Path $UninstallKey -Name "DisplayVersion" -Value $Version
Set-ItemProperty -Path $UninstallKey -Name "Publisher" -Value $Publisher
Set-ItemProperty -Path $UninstallKey -Name "InstallLocation" -Value $InstallDir
Set-ItemProperty -Path $UninstallKey -Name "UninstallString" -Value "powershell -ExecutionPolicy Bypass -Command `"Remove-Item '$InstallDir' -Recurse -Force; Remove-Item '$DesktopShortcut' -Force; Remove-Item '$StartMenuShortcut' -Force; Remove-Item 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$AppName' -Force`""
Set-ItemProperty -Path $UninstallKey -Name "NoModify" -Value 1
Set-ItemProperty -Path $UninstallKey -Name "NoRepair" -Value 1
Write-Host "  Registered in Add/Remove Programs" -ForegroundColor Gray

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "You can now:" -ForegroundColor White
Write-Host "  - Double-click the Desktop shortcut" -ForegroundColor Gray
Write-Host "  - Find '$AppName' in the Start Menu" -ForegroundColor Gray
Write-Host "  - Uninstall via Settings > Apps" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to exit"
