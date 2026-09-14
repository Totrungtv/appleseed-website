@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Apple Seed Robot - Tu dong dong bo GitHub

where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo [LOI] Khong tim thay Python trong PATH.
  echo Hay cai Python 3.13+ roi thu lai.
  echo.
  pause
  exit /b 1
)

if not exist app\updater.py (
  echo.
  echo [LOI] Khong tim thay app\updater.py.
  echo Thu muc Robot nay chua day du.
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo       APPLE SEED ROBOT - TU DONG DONG BO GITHUB
echo ============================================================
echo.
echo GitHub: Totrungtv/appleseed-website
 echo Branch: robot-demo
 echo.
echo Dang kiem tra file thay doi...
echo runtime, models, data se KHONG bi tai lai.
echo.

python app\updater.py --yes
set "ERR=%ERRORLEVEL%"

echo.
if "%ERR%"=="0" (
  echo [OK] Robot da dong bo xong.
) else (
  echo [LOI] Dong bo that bai - ma %ERR%.
  echo Ban sao luu van duoc giu trong data\backups.
)
echo.
pause
exit /b %ERR%
