@echo off
title Apple Seed ADB Bridge
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py apple-seed-adb-bridge.py
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  python apple-seed-adb-bridge.py
  goto :eof
)
echo.
echo Khong tim thay Python 3.
echo Cai Python 3 roi chay lai file nay.
pause
