@echo off
title Coastal Banking Setup
echo.
echo ================================
echo   Coastal Banking Installer
echo   by Coastal Auto Tech
echo ================================
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\CoastalBanking"
set "EXE_NAME=CoastalBanking.exe"

echo Installing to: %INSTALL_DIR%
echo.

:: Create installation directory
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: Copy files
copy /Y "%~dp0%EXE_NAME%" "%INSTALL_DIR%\" >nul

:: Create Desktop shortcut
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Coastal Banking.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\%EXE_NAME%'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Save()"

:: Create Start Menu shortcut
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Coastal Auto Tech" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Coastal Auto Tech"
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Coastal Auto Tech\Coastal Banking.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\%EXE_NAME%'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Save()"

echo.
echo ================================
echo   Installation Complete!
echo ================================
echo.
echo Shortcuts created:
echo   - Desktop: Coastal Banking
echo   - Start Menu: Coastal Auto Tech ^> Coastal Banking
echo.

set /p LAUNCH="Launch Coastal Banking now? (Y/N): "
if /i "%LAUNCH%"=="Y" start "" "%INSTALL_DIR%\%EXE_NAME%"

echo.
pause
