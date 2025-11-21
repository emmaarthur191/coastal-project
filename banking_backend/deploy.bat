@echo off
REM Banking Backend Production Deployment Script for Windows
REM This script handles the complete deployment process for the banking backend application

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_NAME=banking-backend
set DOCKER_COMPOSE_FILE=docker-compose.yml
set DOCKER_COMPOSE_PROD_FILE=docker-compose.prod.yml
set ENV_FILE=.env.production

REM Colors for output (Windows CMD)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

REM Logging functions
:log_info
echo [%BLUE%INFO%NC%] %~1
goto :eof

:log_success
echo [%GREEN%SUCCESS%NC%] %~1
goto :eof

:log_warning
echo [%YELLOW%WARNING%NC%] %~1
goto :eof

:log_error
echo [%RED%ERROR%NC%] %~1
goto :eof

REM Check if required tools are installed
:check_dependencies
call :log_info "Checking dependencies..."

docker --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker is not installed. Please install Docker first."
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit /b 1
)

call :log_success "All dependencies are installed."
goto :eof

REM Validate environment file
:validate_env
call :log_info "Validating environment configuration..."

if not exist "%ENV_FILE%" (
    call :log_error "Production environment file '%ENV_FILE%' not found."
    call :log_info "Please create '%ENV_FILE%' based on '.env.example' and configure production values."
    exit /b 1
)

REM Check for required environment variables
set REQUIRED_VARS=SECRET_KEY DATABASE_URL ALLOWED_HOSTS
for %%v in (%REQUIRED_VARS%) do (
    findstr /b "%%v=" "%ENV_FILE%" >nul 2>&1
    if errorlevel 1 (
        call :log_error "Required environment variable '%%v' not found in '%ENV_FILE%'."
        exit /b 1
    )
)

call :log_success "Environment configuration is valid."
goto :eof

REM Backup current deployment
:backup_current
call :log_info "Creating backup of current deployment..."

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set DATESTR=%%c%%a%%b
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIMESTR=%%a%%b
set BACKUP_DIR=backups\%DATESTR%_%TIMESTR::=%
mkdir "%BACKUP_DIR%" 2>nul

REM Backup database if running
docker-compose ps db | findstr "Up" >nul 2>&1
if not errorlevel 1 (
    call :log_info "Backing up database..."
    docker-compose exec -T db pg_dump -U banking_user banking_db > "%BACKUP_DIR%\database_backup.sql" 2>nul
)

REM Backup environment file
copy "%ENV_FILE%" "%BACKUP_DIR%\" >nul 2>&1

REM Backup docker-compose files
copy "%DOCKER_COMPOSE_FILE%" "%BACKUP_DIR%\" >nul 2>&1
copy "%DOCKER_COMPOSE_PROD_FILE%" "%BACKUP_DIR%\" >nul 2>&1

call :log_success "Backup created in '%BACKUP_DIR%'."
goto :eof

REM Pull latest changes
:pull_changes
call :log_info "Pulling latest changes from repository..."

if exist ".git" (
    git pull origin main
    call :log_success "Repository updated."
) else (
    call :log_warning "Not a git repository. Skipping git pull."
)
goto :eof

REM Build and deploy
:deploy
call :log_info "Building and deploying application..."

REM Stop existing containers
call :log_info "Stopping existing containers..."
docker-compose down

REM Build new images
call :log_info "Building Docker images..."
docker-compose build --no-cache

REM Start services
call :log_info "Starting services..."
docker-compose up -d

REM Wait for services to be healthy
call :log_info "Waiting for services to be healthy..."
timeout /t 30 /nobreak >nul

REM Run database migrations
call :log_info "Running database migrations..."
docker-compose exec -T web python manage.py migrate

REM Collect static files
call :log_info "Collecting static files..."
docker-compose exec -T web python manage.py collectstatic --noinput

REM Run health checks
call :log_info "Running health checks..."
powershell -Command "& {try { $response = Invoke-WebRequest -Uri 'http://localhost/health/' -TimeoutSec 10; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }}" >nul 2>&1
if not errorlevel 1 (
    call :log_success "Health check passed."
) else (
    call :log_warning "Health check failed. Please check the application logs."
)

call :log_success "Deployment completed successfully."
goto :eof

REM Rollback function
:rollback
call :log_info "Rolling back to previous deployment..."

REM Find latest backup
for /f %%i in ('dir /b /ad /o-d backups 2^>nul') do set LATEST_BACKUP=backups\%%i& goto :found_backup
:found_backup

if not defined LATEST_BACKUP (
    call :log_error "No backup found for rollback."
    exit /b 1
)

call :log_info "Rolling back using backup: %LATEST_BACKUP%"

REM Stop current containers
docker-compose down

REM Restore files
copy "%LATEST_BACKUP%\.env.production" . >nul 2>&1
copy "%LATEST_BACKUP%\docker-compose.yml" . >nul 2>&1
copy "%LATEST_BACKUP%\docker-compose.prod.yml" . >nul 2>&1

REM Restore database if backup exists
if exist "%LATEST_BACKUP%\database_backup.sql" (
    call :log_info "Restoring database..."
    docker-compose up -d db
    timeout /t 10 /nobreak >nul
    docker-compose exec -T db psql -U banking_user -d banking_db < "%LATEST_BACKUP%\database_backup.sql"
)

REM Restart services
docker-compose up -d

call :log_success "Rollback completed."
goto :eof

REM Show status
:show_status
call :log_info "Current deployment status:"
docker-compose ps
goto :eof

REM Main deployment function
:main
if "%1"=="" set ACTION=deploy
if "%1"=="deploy" set ACTION=deploy
if "%1"=="rollback" set ACTION=rollback
if "%1"=="status" set ACTION=status
if "%1"=="backup" set ACTION=backup

if "%ACTION%"=="deploy" (
    call :log_info "Starting production deployment for %PROJECT_NAME%..."
    call :check_dependencies
    if errorlevel 1 exit /b 1
    call :validate_env
    if errorlevel 1 exit /b 1
    call :backup_current
    call :pull_changes
    call :deploy
    call :show_status
    call :log_success "Deployment process completed."
) else if "%ACTION%"=="rollback" (
    call :rollback
    call :show_status
) else if "%ACTION%"=="status" (
    call :show_status
) else if "%ACTION%"=="backup" (
    call :backup_current
) else (
    echo Usage: %0 {deploy^|rollback^|status^|backup}
    echo   deploy   - Deploy the application (default)
    echo   rollback - Rollback to previous deployment
    echo   status   - Show current deployment status
    echo   backup   - Create a backup of current deployment
    exit /b 1
)
goto :eof

REM Run main function with all arguments
call :main %*