@echo off
setlocal EnableExtensions
title Apple Seed - Fix ADB

echo ============================================================
echo        APPLE SEED - FIX ADB / USB
echo        Bundled Android SDK Platform-Tools
echo ============================================================
echo.

set "ROOT=%~dp0"
set "ADB=%ROOT%platform-tools\adb.exe"

if not exist "%ADB%" (
  echo [ERROR] Khong tim thay platform-tools\adb.exe
  echo Giai nen day du goi Fix-ADB.zip truoc khi chay.
  pause
  exit /b 1
)

echo [1/4] Dong cac chuong trinh co the chiem ADB/USB...
for %%P in (HiSuite.exe HiSuiteService.exe HiSuiteService64.exe HiSuiteDownloader.exe hdb.exe HonorSuite.exe HonorSuiteService.exe HonorSuiteService64.exe PhoneExperienceHost.exe YourPhone.exe CrossDeviceService.exe scrcpy.exe sndcpy.exe Vysor.exe AirDroid.exe AirDroidCast.exe Mobizen.exe ApowerMirror.exe LetsView.exe MirrorTo.exe 360MobileMgr.exe 360sd.exe 360se.exe wandoujia.exe pea.exe Kies.exe KiesTrayAgent.exe SmartSwitchPC.exe SideSync.exe) do (
  taskkill /F /T /IM "%%P" >nul 2>nul
)
echo OK.
echo.

echo [2/4] Dung ADB server...
"%ADB%" kill-server
echo OK.
echo.

echo [3/4] Kiem tra platform-tools...
"%ADB%" version
echo.

echo [4/4] Khoi dong lai ADB server...
"%ADB%" start-server
echo.
echo ============================================================
echo  DA FIX ADB.
echo  Rut/cam lai cap USB, mo lai Chrome va bam Ket noi thiet bi.
echo  Neu dien thoai hien "Cho phep go loi USB?" hay bam Cho phep.
echo ============================================================
pause
