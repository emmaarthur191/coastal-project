@echo off
echo Running Newman API Regression Tests...

REM Check if Newman is installed
newman --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Newman is not installed. Installing Newman globally...
    npm install -g newman
    if %errorlevel% neq 0 (
        echo Failed to install Newman. Please install Node.js and npm first.
        pause
        exit /b 1
    )
)

REM Create reports directory if it doesn't exist
if not exist "test_reports" mkdir test_reports

REM Run Newman with collection and environment
echo Running API tests...
newman run banking_api_collection.json ^
    --environment postman_environment.json ^
    --reporters cli,json,html ^
    --reporter-json-export test_reports/newman_results.json ^
    --reporter-html-export test_reports/newman_report.html ^
    --timeout 30000 ^
    --delay-request 1000 ^
    --bail

if %errorlevel% equ 0 (
    echo Newman tests completed successfully!
    echo Reports generated in test_reports/ directory
) else (
    echo Newman tests failed with errors.
    echo Check test_reports/ for detailed results
)

pause