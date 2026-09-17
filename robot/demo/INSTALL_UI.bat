@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Apple Seed Robot - Install Real AI
echo ==========================================
echo   APPLE SEED ROBOT - REAL CHAT + VISION
echo ==========================================
echo.
echo Khong xoa Ollama/model cu.
echo.

if not exist runtime mkdir runtime
if not exist models mkdir models
if not exist data mkdir data

set "RUNTIME_URL=https://github.com/ggml-org/llama.cpp/releases/download/b10903/llama-b10903-bin-win-cuda-12.4-x64.zip"
set "MODEL_URL=https://huggingface.co/Qwen/Qwen3-VL-4B-Instruct-GGUF/resolve/main/Qwen3VL-4B-Instruct-Q4_K_M.gguf?download=true"
set "MMPROJ_URL=https://huggingface.co/Qwen/Qwen3-VL-4B-Instruct-GGUF/resolve/main/mmproj-Qwen3VL-4B-Instruct-Q8_0.gguf?download=true"

echo [1/3] Kiem tra llama.cpp runtime...
if exist runtime\llama-server.exe goto runtime_ok

echo     Dang tai llama.cpp CUDA runtime...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$ErrorActionPreference='Stop';" ^
 "$url=$env:RUNTIME_URL;" ^
 "$zip=Join-Path $PWD 'runtime\llama-runtime.part.zip';" ^
 "$tmp=Join-Path $PWD 'runtime\_extract';" ^
 "if(Test-Path $zip){Remove-Item $zip -Force};" ^
 "if(Test-Path $tmp){Remove-Item $tmp -Recurse -Force};" ^
 "Invoke-WebRequest -UseBasicParsing -MaximumRedirection 10 $url -OutFile $zip;" ^
 "Expand-Archive -LiteralPath $zip -DestinationPath $tmp -Force;" ^
 "$exe=Get-ChildItem $tmp -Recurse -File -Filter 'llama-server.exe' | Select-Object -First 1;" ^
 "if(-not $exe){throw 'Khong tim thay llama-server.exe trong goi runtime'};" ^
 "$rt=Join-Path $PWD 'runtime';" ^
 "$all=Get-ChildItem $tmp -Recurse -File | Where-Object { $_.Extension -in '.exe','.dll' };" ^
 "foreach($f in $all){ Copy-Item $f.FullName (Join-Path $rt $f.Name) -Force };" ^
 "if(-not (Test-Path (Join-Path $rt 'llama-server.exe'))){throw 'Khong the cai llama-server.exe'};" ^
 "Remove-Item $zip -Force -ErrorAction SilentlyContinue;" ^
 "Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue"
if errorlevel 1 goto fail
echo     Runtime OK.
:runtime_ok
echo     Runtime da san sang.

echo.
echo [2/3] Kiem tra Qwen3-VL 4B...
if exist models\Qwen3VL-4B-Instruct-Q4_K_M.gguf goto model_ok

echo     Dang tai model ~2.5 GB. Vui long cho...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$ErrorActionPreference='Stop';" ^
 "$url=$env:MODEL_URL;" ^
 "$out=Join-Path $PWD 'models\Qwen3VL-4B-Instruct-Q4_K_M.gguf';" ^
 "$part=$out+'.part';" ^
 "if(Test-Path $part){Remove-Item $part -Force};" ^
 "Invoke-WebRequest -UseBasicParsing -MaximumRedirection 10 $url -OutFile $part;" ^
 "$n=(Get-Item $part).Length;" ^
 "if($n -lt 2000000000){throw ('Model tai khong hop le: '+$n+' bytes')};" ^
 "Move-Item $part $out -Force"
if errorlevel 1 goto fail
:model_ok
echo     Model OK.

echo.
echo [3/3] Kiem tra vision projector ~454 MB...
if exist models\mmproj-Qwen3VL-4B-Instruct-Q8_0.gguf goto mmproj_ok

echo     Dang tai projector...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$ErrorActionPreference='Stop';" ^
 "$url=$env:MMPROJ_URL;" ^
 "$out=Join-Path $PWD 'models\mmproj-Qwen3VL-4B-Instruct-Q8_0.gguf';" ^
 "$part=$out+'.part';" ^
 "if(Test-Path $part){Remove-Item $part -Force};" ^
 "Invoke-WebRequest -UseBasicParsing -MaximumRedirection 10 $url -OutFile $part;" ^
 "$n=(Get-Item $part).Length;" ^
 "if($n -lt 300000000){throw ('Projector tai khong hop le: '+$n+' bytes')};" ^
 "Move-Item $part $out -Force"
if errorlevel 1 goto fail
:mmproj_ok
echo     Projector OK.

echo.
echo ==========================================
echo   INSTALL REAL AI HOAN TAT
echo ==========================================
echo.
echo Chay START_UI.bat de mo Apple Seed Robot.
pause
exit /b 0

:fail
echo.
echo ==========================================
echo   INSTALL THAT BAI
echo ==========================================
echo.
echo Kiem tra loi o ngay phia tren.
echo Khong xoa Ollama/model cu.
echo.
pause
exit /b 1
