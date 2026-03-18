@echo off
chcp 65001 >nul 2>&1
title WeChat Miniprogram Debug

cls
echo ====================================
echo   Charm Fishing Miniprogram Debug
echo ====================================
echo.

set PROJECT=D:\fish\miniprogram

echo Project: %PROJECT%
echo.
echo Starting WeChat DevTools...
echo.

REM Try different installation paths
if exist "C:\Program Files (x86)\Tencent\微信 web 开发者工具\cli.exe" (
    start "" "C:\Program Files (x86)\Tencent\微信 web 开发者工具\cli.exe" open "%PROJECT%"
    goto :success
)

if exist "C:\Program Files\Tencent\微信 web 开发者工具\cli.exe" (
    start "" "C:\Program Files\Tencent\微信 web 开发者工具\cli.exe" open "%PROJECT%"
    goto :success
)

if exist "D:\微信 web 开发者工具\cli.exe" (
    start "" "D:\微信 web 开发者工具\cli.exe" open "%PROJECT%"
    goto :success
)

echo WeChat DevTools CLI not found.
echo.
echo Please open WeChat DevTools manually and import:
echo   %PROJECT%
echo.
pause
exit /b 1

:success
echo Started successfully!
echo.
echo Check the WeChat DevTools window.
echo.
timeout /t 2 /nobreak >nul
explorer "%PROJECT%"
exit /b 0
