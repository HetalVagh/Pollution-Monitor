@echo off
title Golden Corridor Pollution Monitor — RUNNING
color 0B
echo.
echo =====================================================================
echo   SMART INDUSTRIAL POLLUTION MONITORING SYSTEM
echo   Golden Corridor (Vapi - Ankleshwar - Vatva), Gujarat
echo =====================================================================
echo.

REM Check if node_modules installed
IF NOT EXIST "%~dp0backend\node_modules" (
    color 0E
    echo WARNING: Dependencies not installed. Running setup first...
    echo.
    call "%~dp0INSTALL.bat"
)

echo  Starting Backend API Server (Port 5000)...
cd /d "%~dp0backend"
start "Pollution Monitor - Backend API" cmd /k "color 0A && echo [BACKEND] Starting on http://localhost:5000 && node server.js"

echo  Waiting for backend to start...
timeout /t 4 /nobreak > nul

echo  Starting React Frontend (Port 3000)...
cd /d "%~dp0frontend"
start "Pollution Monitor - Frontend React" cmd /k "color 0B && echo [FRONTEND] Starting on http://localhost:3000 && npm start"

echo  Waiting for frontend to compile...
timeout /t 8 /nobreak > nul

echo  Opening application in browser...
start http://localhost:3000

echo.
echo =====================================================================
echo   APPLICATION IS RUNNING!
echo.
echo   Frontend Dashboard : http://localhost:3000
echo   Backend API        : http://localhost:5000
echo   API Health Check   : http://localhost:5000/api/health
echo   Dashboard Stats    : http://localhost:5000/api/dashboard
echo   Violations         : http://localhost:5000/api/violations
echo   Alerts             : http://localhost:5000/api/alerts
echo.
echo   To STOP the application, close the two terminal windows.
echo =====================================================================
echo.
echo Press any key to open the API documentation...
pause > nul
start http://localhost:5000/api/dashboard
