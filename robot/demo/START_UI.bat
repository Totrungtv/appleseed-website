@echo off
setlocal
cd /d "%~dp0"
title Apple Seed Robot

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

python app\main.py
if errorlevel 1 pause
