@echo off
REM Automated Database Backup Script for Banking Backend (Windows)
REM This script creates encrypted, compressed backups and manages retention

setlocal enabledelayedexpansion

REM Configuration
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "BACKUP_DIR=%BACKUP_DIR%"
if "%BACKUP_DIR%"=="" set "BACKUP_DIR=%PROJECT_DIR%\backups\database"
set "LOG_FILE=%LOG_FILE%"
if "%LOG_FILE%"=="" set "LOG_FILE=%PROJECT_DIR%\logs\backup.log"
set "RETENTION_DAYS=%RETENTION_DAYS%"
if "%RETENTION_DAYS%"=="" set RETENTION_DAYS=30

REM Database configuration (from environment or defaults)
set "DB_HOST=%DB_HOST%"
if "%DB_HOST%"=="" set DB_HOST=localhost
set "DB_PORT=%DB_PORT%"
if "%DB_PORT%"=="" set DB_PORT=5432
set "DB_NAME=%DB_NAME%"
if "%DB_NAME%"=="" set DB_NAME=banking_db
set "DB_USER=%DB_USER%"
if "%DB_USER%"=="" set DB_USER=banking_user
set "DB_PASSWORD=%DB_PASSWORD%"

REM Logging functions
:log
echo %date% %time% - %* >> "%LOG_FILE%"
echo %date% %time% - %*
goto :eof

:error_exit
call :log "ERROR: %~1"
exit /b 1

REM Validate environment
:validate_environment
call :log "Validating backup environment..."

REM Check if backup directory exists
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%" 2>nul
    if errorlevel 1 (
        call :error_exit "Failed to create backup directory: %BACKUP_DIR%"
    )
)

REM Check database connectivity (simplified check)
call :log "Note: Database connectivity check skipped on Windows"

REM Check if encryption key is available
if "%BACKUP_ENCRYPTION_KEY%"=="" (
    call :log "WARNING: BACKUP_ENCRYPTION_KEY not set. Backups will not be encrypted."
)

call :log "Environment validation completed."
goto :eof

REM Create backup
:create_backup
set "timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "timestamp=%timestamp: =0%"
set "backup_filename=backup_%timestamp%.sql"
set "backup_path=%BACKUP_DIR%\%backup_filename%"

call :log "Creating database backup: %backup_filename%"

REM Create pg_dump command (assuming pg_dump is in PATH)
set "pg_dump_cmd=pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --no-password --format=custom --compress=9 --verbose --file="%backup_path%""

REM Set password environment variable
set PGPASSWORD=%DB_PASSWORD%

REM Execute backup
%pg_dump_cmd%
if %errorlevel% equ 0 (
    call :log "Backup created successfully: %backup_path%"

    REM Get backup size
    for %%A in ("%backup_path%") do set "size=%%~zA"
    call :log "Backup size: %size% bytes"

    REM Compress backup
    call :compress_backup "%backup_path%"

    REM Encrypt backup if key is available
    if defined BACKUP_ENCRYPTION_KEY (
        call :encrypt_backup "%backup_path%.gz"
    )

    goto :eof
) else (
    call :error_exit "Backup creation failed"
)

REM Compress backup
:compress_backup
set "input_file=%~1"
set "output_file=%input_file%.gz"

call :log "Compressing backup: %output_file%"

REM Use PowerShell for compression since Windows doesn't have gzip by default
powershell -Command "& { try { $input = Get-Content -Path '%input_file%' -Encoding Byte; $output = [System.IO.Compression.GZipStream]::new([System.IO.File]::Create('%output_file%'), [System.IO.Compression.CompressionMode]::Compress); $output.Write($input, 0, $input.Length); $output.Close(); Remove-Item '%input_file%'; exit 0 } catch { exit 1 } }"
if %errorlevel% equ 0 (
    call :log "Compression completed: %output_file%"
    goto :eof
) else (
    call :log "WARNING: Compression failed for %input_file%"
    goto :eof
)

REM Encrypt backup using PowerShell
:encrypt_backup
set "input_file=%~1"
set "output_file=%input_file%.enc"

call :log "Encrypting backup: %output_file%"

REM Use PowerShell for AES encryption
powershell -Command "& { try { $key = [System.Text.Encoding]::UTF8.GetBytes('%BACKUP_ENCRYPTION_KEY%'); $aes = [System.Security.Cryptography.Aes]::Create(); $aes.Key = $key; $aes.GenerateIV(); $encryptor = $aes.CreateEncryptor(); $input = [System.IO.File]::ReadAllBytes('%input_file%'); $output = [System.IO.File]::Create('%output_file%'); $output.Write($aes.IV, 0, $aes.IV.Length); $cryptoStream = [System.Security.Cryptography.CryptoStream]::new($output, $encryptor, [System.Security.Cryptography.CryptoStreamMode]::Write); $cryptoStream.Write($input, 0, $input.Length); $cryptoStream.FlushFinalBlock(); $cryptoStream.Close(); $output.Close(); Remove-Item '%input_file%'; exit 0 } catch { exit 1 } }"
if %errorlevel% equ 0 (
    call :log "Encryption completed: %output_file%"
    goto :eof
) else (
    call :log "WARNING: Encryption failed for %input_file%"
    goto :eof
)

REM List backups
:list_backups
call :log "Available backups in %BACKUP_DIR%:"

if not exist "%BACKUP_DIR%" (
    call :log "Backup directory does not exist"
    goto :eof
)

set count=0
for %%f in ("%BACKUP_DIR%\backup_*.sql*") do (
    set "filename=%%~nf%%~xf"
    for %%A in ("%%f") do set "size=%%~zA"
    for %%A in ("%%f") do set "mtime=%%~tA"
    echo   !filename! - !size! bytes - !mtime!
    set /a count+=1
)

if !count! equ 0 (
    call :log "No backups found"
) else (
    call :log "Total backups: !count!"
)
goto :eof

REM Cleanup old backups
:cleanup_old_backups
set "days=%~1"
if "%days%"=="" set days=%RETENTION_DAYS%

call :log "Cleaning up backups older than %days% days..."

if not exist "%BACKUP_DIR%" (
    call :log "Backup directory does not exist"
    goto :eof
)

set count=0
for %%f in ("%BACKUP_DIR%\backup_*.sql*") do (
    REM Check if file is older than retention period
    forfiles /p "%BACKUP_DIR%" /m "%%~nf%%~xf" /d -%days% /c "cmd /c if @isdir==FALSE del @file" 2>nul
    if !errorlevel! equ 0 (
        call :log "Removing old backup: %%~nf%%~xf"
        set /a count+=1
    )
)

call :log "Cleaned up %count% old backups"
goto :eof

REM Send notification (placeholder)
:send_notification
set "subject=%~1"
set "message=%~2"
call :log "NOTIFICATION: %subject% - %message%"
REM Add notification logic here (email, webhook, etc.)
goto :eof

REM Main function
:main
if "%1"=="" set ACTION=backup
if "%1"=="backup" set ACTION=backup
if "%1"=="list" set ACTION=list
if "%1"=="cleanup" set ACTION=cleanup
if "%1"=="validate" set ACTION=validate

if "%ACTION%"=="backup" (
    call :validate_environment
    call :create_backup
    call :cleanup_old_backups
    call :send_notification "Backup Completed" "Database backup completed successfully"
) else if "%ACTION%"=="list" (
    call :list_backups
) else if "%ACTION%"=="cleanup" (
    call :cleanup_old_backups "%2"
) else if "%ACTION%"=="validate" (
    call :validate_environment
) else (
    echo Usage: %0 {backup^|list^|cleanup [days]^|validate}
    echo   backup     - Create a new database backup
    echo   list       - List all available backups
    echo   cleanup    - Remove backups older than specified days (default: %RETENTION_DAYS%)
    echo   validate   - Validate backup environment
    exit /b 1
)
goto :eof

REM Run main function
call :main %*