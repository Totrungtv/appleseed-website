@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Apple Seed Robot - Tu dong dong bo GitHub

set "UPDATER_URL=https://raw.githubusercontent.com/Totrungtv/appleseed-website/robot-demo/robot/demo/app/updater.py"
set "UPDATER=%~dp0app\updater.py"

where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo [LOI] Khong tim thay Python trong PATH.
  echo Hay cai Python 3.13+ roi thu lai.
  echo.
  pause
  exit /b 1
)

if not exist "%~dp0app" mkdir "%~dp0app"

REM Tu dong lay updater moi nhat neu may chua co updater.py.
if not exist "%UPDATER%" (
  echo.
  echo [Apple Seed Robot] Dang lay bo dong bo lan dau...
  echo.
  curl.exe -L --fail --silent --show-error --connect-timeout 15 --max-time 60 "%UPDATER_URL%" -o "%UPDATER%"
  if errorlevel 1 (
    echo.
    echo [LOI] Khong tai duoc updater.py tu GitHub.
    echo Kiem tra Internet roi chay lai.
    echo.
    if exist "%UPDATER%" del /q "%UPDATER%" >nul 2>nul
    pause
    exit /b 2
  )
)

if not exist "%UPDATER%" (
  echo [LOI] Khong tao duoc app\updater.py.
  pause
  exit /b 3
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

python "%UPDATER%" --yes
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
