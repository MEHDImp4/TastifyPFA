@echo off
setlocal

cd /d "%~dp0"
echo Tastify full test suite: backend, frontend, builds, and E2E browser tests.
echo Tip: use run-all-tests.bat -SkipE2E for a faster check without Playwright.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-all-tests.ps1" %*

if errorlevel 1 (
  echo.
  echo Tastify tests failed. Check the messages above.
  pause
  exit /b 1
)

echo.
echo Tastify tests passed.
pause
