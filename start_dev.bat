@echo off
title Food Delivery Route Planner (Dev Mode)
echo ========================================================
echo   Food Delivery Route Planner - Development Mode
echo ========================================================
echo.
echo Launching Flask Backend on port 5000...
start cmd /k "python backend/app.py"

echo Launching Vite React Frontend on port 3000...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers started!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo.
