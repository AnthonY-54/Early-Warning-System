@echo off
REM ============================================================
REM  DWDM Full System Start Script (ML Service + Backend + Frontend)
REM  Opens three terminal windows:
REM   1. Python FastAPI ML Service (uvicorn api.main:app --port 8000 --reload)
REM   2. Node.js Backend Server    (npm run dev)
REM   3. React Frontend Server     (npm run dev)
REM
REM  HOW TO USE:
REM  1. Run this file from the project root (or batch files folder).
REM  2. Three windows will launch automatically.
REM ============================================================

setlocal enabledelayedexpansion

REM Base directory where the DWDM web app sits
set "CURRENT_DIR=%~dp0"

REM If running from "batch files" folder, adjust base to root
if exist "%CURRENT_DIR%..\backend" (
    set "PROJECT_ROOT=%CURRENT_DIR%..\"
) else (
    set "PROJECT_ROOT=%CURRENT_DIR%"
)

REM Detect ML model folder (checks both possible folder names)
set "ML_PATH=%PROJECT_ROOT%..\at-risk-student-model"
if not exist "%ML_PATH%" (
    set "ML_PATH=%PROJECT_ROOT%..\at-risk-student-detection-model"
)

echo ============================================================
echo   Starting DWDM Full-Stack System (3 Services)
echo ============================================================

REM 1. Start Python FastAPI ML Service
if exist "%ML_PATH%" (
    echo [1/3] Starting Python ML Model Service from %ML_PATH% on port 8000...
    start "DWDM ML Service (FastAPI)" cmd /k "cd /d "%ML_PATH%" && (if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) else if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat)) && uvicorn api.main:app --port 8000 --reload"
) else (
    echo [1/3] Note: ML folder not found.
    start "DWDM ML Service (FastAPI)" cmd /k "echo ML model folder not found at: %ML_PATH% & echo Please navigate to your ML service folder and run: uvicorn api.main:app --port 8000 --reload"
)

REM 2. Start Node.js Backend Server
echo [2/3] Starting Node.js Backend Server on port 5000...
start "DWDM Backend" cmd /k "cd /d "%PROJECT_ROOT%backend" && npm run dev"

REM 3. Start React Frontend Server
echo [3/3] Starting React Frontend Server on port 5173...
start "DWDM Frontend" cmd /k "cd /d "%PROJECT_ROOT%frontend" && npm run dev"

echo.
echo ============================================================
echo  All 3 services are launching in separate windows:
echo   - ML Service:  http://localhost:8000
echo   - Backend:     http://localhost:5000
echo   - Frontend:    http://localhost:5173
echo ============================================================
