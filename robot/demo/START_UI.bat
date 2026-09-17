@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Apple Seed Robot

REM Always refresh the Robot source from the selected branch before launch.
REM This prevents an old local PDF tool from surviving a sync.
set "RAW=https://raw.githubusercontent.com/Totrungtv/appleseed-website/robot-demo/robot/demo"
if not exist "%~dp0app" mkdir "%~dp0app"
if not exist "%~dp0assets" mkdir "%~dp0assets"

echo [Apple Seed Robot] Dang dong bo source moi nhat...
curl.exe -L --fail --silent --show-error --connect-timeout 15 --max-time 60 "%RAW%/app/pdf_tool.py" -o "%~dp0app\pdf_tool.py"
if errorlevel 1 (
  echo [LOI] Khong tai duoc pdf_tool.py. Kiem tra Internet.
  pause
  exit /b 10
)
curl.exe -L --fail --silent --show-error --connect-timeout 15 --max-time 60 "%RAW%/app/launcher.py" -o "%~dp0app\launcher.py"
if errorlevel 1 (
  echo [LOI] Khong tai duoc launcher.py. Kiem tra Internet.
  pause
  exit /b 11
)

if not exist runtime\llama-server.exe (
  echo.
  echo [Apple Seed Robot] Chua co AI runtime. Tu dong cai dat...
  echo.
  call "%~dp0INSTALL_UI.bat"
  if errorlevel 1 exit /b 1
)

if not exist models\Qwen3VL-4B-Instruct-Q4_K_M.gguf (
  echo.
  echo [Apple Seed Robot] Chua co Vision model. Tu dong cai dat...
  echo.
  call "%~dp0INSTALL_UI.bat"
  if errorlevel 1 exit /b 1
)

if not exist models\mmproj-Qwen3VL-4B-Instruct-Q8_0.gguf (
  echo.
  echo [Apple Seed Robot] Chua co Vision projector. Tu dong cai dat...
  echo.
  call "%~dp0INSTALL_UI.bat"
  if errorlevel 1 exit /b 1
)

echo [Apple Seed Robot] Kiem tra PDF engine...
python -c "import fitz" >nul 2>&1
if errorlevel 1 (
  echo [Apple Seed Robot] Dang cai PyMuPDF cho PDF Reader/Editor...
  python -m pip install --disable-pip-version-check -q PyMuPDF
  if errorlevel 1 (
    echo [PDF] Khong cai duoc PyMuPDF. AI Robot van co the chay, PDF se bao thieu thu vien.
  )
)

python app\launcher.py
if errorlevel 1 pause
