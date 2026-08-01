@echo off
title Golden Corridor Pollution Monitor — SETUP
color 0A
echo.
echo =====================================================================
echo   SMART INDUSTRIAL POLLUTION MONITORING SYSTEM
echo   Golden Corridor (Vapi - Ankleshwar - Vatva), Gujarat
echo   Challenge 9 - Environmental Sustainability
echo =====================================================================
echo.
echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    echo Then re-run this setup file.
    pause
    exit /b 1
)
echo  Node.js found: 
node --version

echo.
echo [2/4] Checking npm installation...
npm --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ERROR: npm is not available!
    pause
    exit /b 1
)
echo  npm found: 
npm --version

echo.
echo [3/4] Installing Backend dependencies...
echo  (This may take a few minutes on first run)
cd /d "%~dp0backend"
call npm install
IF %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ERROR: Failed to install backend dependencies!
    pause
    exit /b 1
)
echo  Backend dependencies installed successfully!

echo.
echo [4/4] Installing Frontend dependencies...
echo  (This may take a few minutes on first run)
cd /d "%~dp0frontend"
call npm install
IF %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ERROR: Failed to install frontend dependencies!
    pause
    exit /b 1
)
echo  Frontend dependencies installed successfully!

echo.
echo =====================================================================
echo   SETUP COMPLETE! 
echo.
echo   You can now run the project by double-clicking:
echo   -> START_APP.bat
echo =====================================================================
echo.
pause

