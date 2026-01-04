[Setup]
AppName=Coastal Banking
AppVersion=1.0.0
AppPublisher=Coastal Auto Tech
DefaultDirName={autopf}\Coastal Banking
DefaultGroupName=Coastal Banking
OutputDir=installer
OutputBaseFilename=CoastalBanking_Setup
SetupIconFile=assets\icon.ico
Compression=lzma
SolidCompression=yes
PrivilegesRequired=lowest

[Tasks]
Name: desktopicon; Description: Create a desktop shortcut; Flags: checked

[Files]
Source: dist\CoastalBanking.exe; DestDir: {app}; Flags: ignoreversion

[Icons]
Name: {group}\Coastal Banking; Filename: {app}\CoastalBanking.exe
Name: {autodesktop}\Coastal Banking; Filename: {app}\CoastalBanking.exe; Tasks: desktopicon

[Run]
Filename: {app}\CoastalBanking.exe; Description: Launch Coastal Banking; Flags: nowait postinstall skipifsilent
