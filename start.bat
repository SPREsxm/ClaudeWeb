@echo off
title Claude Web - AI Development Interface
echo ============================================
echo   Claude Web - Starting Development Server
echo ============================================
echo.

cd /d "%~dp0"

REM Check and install dependencies only if missing
if not exist "node_modules" (
    echo [1/3] Installing root dependencies...
    call npm install --silent
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install root dependencies
        pause
        exit /b 1
    )
)

if not exist "client\node_modules" (
    echo [2/3] Installing client dependencies...
    cd client
    call npm install --silent
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install client dependencies
        pause
        exit /b 1
    )
    cd ..
)

if not exist "server\node_modules" (
    echo [3/3] Installing server dependencies...
    cd server
    call npm install --silent
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install server dependencies
        pause
        exit /b 1
    )
    cd ..
)

echo.
echo ============================================
echo   Starting Claude Web...
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:4000
echo ============================================
echo.

call npm run dev
pause
