@echo off
REM ============================================================
REM  DWDM Project — Start Script
REM  Opens two terminal windows:
REM   1. Backend server  (npm run dev)
REM   2. Frontend server (npm run dev)
REM
REM  HOW TO USE:
REM  1. Place this file in the ROOT of your project — the same
REM     folder that directly contains the "backend" and
REM     "frontend" folders.
REM  2. Double-click this file (or run it from a terminal).
REM  3. Two new windows will open and start both servers.
REM  4. To stop everything, just close those two windows
REM     (or press Ctrl+C inside each one).
REM ============================================================

echo Starting DWDM backend and frontend servers...

REM %~dp0 = the folder this script itself is sitting in.
REM This makes the script work regardless of where you double-click it from.

start "DWDM Backend" cmd /k "cd /d %~dp0backend && npm run dev"
start "DWDM Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Both servers are starting in separate windows.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
