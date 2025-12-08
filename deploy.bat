@echo off
echo ========================================
echo Coastal Banking - Docker Deployment
echo ========================================
echo.

echo Step 1: Configuring Firewall...
echo (Requires Administrator privileges)
netsh advfirewall firewall add rule name="Coastal Banking HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Coastal Banking HTTPS" dir=in action=allow protocol=TCP localport=443
echo.

echo Step 2: Building Docker Images...
docker-compose build
if %errorlevel% neq 0 (
    echo ERROR: Docker build failed!
    pause
    exit /b 1
)
echo.

echo Step 3: Starting Containers...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start containers!
    pause
    exit /b 1
)
echo.

echo Step 4: Waiting for services to start...
timeout /t 10 /nobreak
echo.

echo Step 5: Running Database Migrations...
docker exec -it coastal_backend python manage.py migrate
echo.

echo Step 6: Collecting Static Files...
docker exec -it coastal_backend python manage.py collectstatic --noinput
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Access the application at:
echo - Local: http://localhost
echo - Network: http://172.17.96.1
echo.
echo Next steps:
echo 1. Create superuser: docker exec -it coastal_backend python manage.py createsuperuser
echo 2. Configure port forwarding for internet access
echo 3. Set up SSL/HTTPS for production
echo.
echo View logs: docker-compose logs -f
echo Stop services: docker-compose down
echo.
pause
