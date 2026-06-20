@echo off
setlocal

cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-demo-local.ps1" %*

if errorlevel 1 (
  echo.
  echo Tastify demo failed to start. Check the messages above.
  pause
  exit /b 1
)

echo.
echo Tastify demo stopped and cleaned.
