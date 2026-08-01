@echo off
title Pollution Monitor — Stop All Services
color 0C
echo.
echo =====================================================================
echo   STOPPING Golden Corridor Pollution Monitor
echo =====================================================================
echo.
echo Stopping all Node.js processes...
taskkill /F /IM node.exe /T >nul 2>&1
echo  All services stopped.
echo.
timeout /t 2 /nobreak > nul
echo  Services stopped successfully.
echo =====================================================================
pause
