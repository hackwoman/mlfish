@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo Searching for WeChat DevTools...
echo.

set "PROJECT=D:\fish\miniprogram"

REM Search in common locations
for %%p in (
    "C:\Program Files\Tencent\微信 web 开发者工具"
    "C:\Program Files (x86)\Tencent\微信 web 开发者工具"
    "D:\微信 web 开发者工具"
    "%LOCALAPPDATA%\微信开发者工具"
) do (
    if exist "%%p\cli.exe" (
        echo Found: %%p
        start "" "%%p\cli.exe" open "%PROJECT%"
        echo Started!
        goto :end
    )
)

REM Search using dir command
for /f "delims=" %%d in ('dir /b /ad "C:\Program Files\Tencent" 2^>nul') do (
    if "!dir!"=="微信 web 开发者工具" (
        if exist "C:\Program Files\Tencent\!dir!\cli.exe" (
            start "" "C:\Program Files\Tencent\!dir!\cli.exe" open "%PROJECT%"
            goto :end
        )
    )
)

echo Not found. Please open WeChat DevTools manually.
echo Project: %PROJECT%

:end
pause
