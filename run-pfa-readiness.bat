@echo off
setlocal

cd /d "%~dp0"
echo Tastify PFA readiness suite: full rebuild tests, cross-app E2E, and browser matrix.
echo Tip: use run-pfa-readiness.bat -SkipFullSuite for a faster rehearsal-only check.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-pfa-readiness.ps1" %*

if errorlevel 1 (
  echo.
  echo Tastify PFA readiness failed. Check the messages above and the report in output.
  pause
  exit /b 1
)

echo.
echo Tastify PFA readiness passed.
pause
