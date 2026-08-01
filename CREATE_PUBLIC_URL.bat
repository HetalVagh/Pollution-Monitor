@echo off
title Golden Corridor — Create Public URL (ngrok)
color 0D
echo.
echo =====================================================================
echo   CREATE PUBLIC URL — Golden Corridor Pollution Monitor
echo   Using ngrok for public tunnel
echo =====================================================================
echo.

REM Check if ngrok is installed
ngrok version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ngrok not found. Attempting to install via npm...
    npm install -g ngrok >nul 2>&1
    ngrok version >nul 2>&1
    IF %ERRORLEVEL% NEQ 0 (
        echo.
        echo ngrok not available via npm either.
        echo.
        echo MANUAL INSTALLATION OPTIONS:
        echo.
        echo Option 1 - Download from official site:
        echo   1. Go to https://ngrok.com/download
        echo   2. Download ngrok for Windows
        echo   3. Extract ngrok.exe to this folder or add to PATH
        echo   4. Run: ngrok authtoken YOUR_TOKEN
        echo   5. Run: ngrok http 3000
        echo.
        echo Option 2 - Using npm (if Node.js installed):
        echo   npm install -g @ngrok/ngrok
        echo   ngrok http 3000
        echo.
        echo Option 3 - Using localtunnel (no account needed):
        echo   npm install -g localtunnel
        echo   lt --port 3000 --subdomain golden-corridor-pollution
        echo.
        echo Option 4 - Using Cloudflare Tunnel:
        echo   winget install --id Cloudflare.cloudflared
        echo   cloudflared tunnel --url http://localhost:3000
        echo.
        pause
        goto :trylocaltunnel
    )
)

echo ngrok found! Creating public tunnel for port 3000...
echo.
echo =====================================================================
echo   Your public URL will appear below.
echo   Share this URL with anyone to access the dashboard remotely.
echo =====================================================================
echo.
ngrok http 3000 --log=stdout
goto :end

:trylocaltunnel
echo.
echo Trying localtunnel as fallback...
localtunnel --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Installing localtunnel...
    call npm install -g localtunnel
)
echo.
echo Starting localtunnel on port 3000...
echo Your public URL will be displayed below:
echo.
lt --port 3000

:end
pause
