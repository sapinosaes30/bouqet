@echo off
setlocal
cd /d "%~dp0"
title A little something for you, bun.
where powershell.exe >nul 2>nul
if errorlevel 1 (
  echo Windows PowerShell could not be found.
  echo This launcher requires the built-in Windows PowerShell component.
  echo Press any key to close.
  pause >nul
  exit /b 1
)
echo Starting the bouquet website...
echo Your browser should open automatically.
echo Keep this window open while viewing the website.
echo Press Ctrl+C here to stop the website.
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
echo.
echo The website server has stopped.
pause
endlocal
