@echo off
setlocal
cd /d "%~dp0"
title Apple Seed Robot - Dong bo GitHub

where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo [LOI] Khong tim thay Python.
  echo Hay cai Python 3.13+ roi thu lai.
  pause
  exit /b 1
)

python app\updater.py
set ERR=%ERRORLEVEL%
echo.
if not "%ERR%"=="0" (
  echo [Apple Seed Robot] Dong bo ket thuc voi ma loi %ERR%.
  pause
  exit /b %ERR%
)

echo [Apple Seed Robot] Dong bo thanh cong.
pause
