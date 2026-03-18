@echo off
chcp 65001 >nul 2>&1
title 魅力海钓小程序 - 开发调试

cls
echo ====================================
echo   魅力海钓小程序 - 开发调试
echo ====================================
echo.

set PROJECT=D:\fish\miniprogram
set APPID=wx504a5b83dba5ce0b

echo 项目路径：%PROJECT%
echo AppID: %APPID%
echo.
echo 正在启动微信开发者工具...
echo.

REM 尝试不同路径
if exist "C:\Program Files (x86)\Tencent\微信 web 开发者工具\cli.exe" (
    echo 找到工具：C:\Program Files (x86)\Tencent\微信 web 开发者工具
    start "" "C:\Program Files (x86)\Tencent\微信 web 开发者工具\cli.exe" open "%PROJECT%"
    goto :success
)

if exist "C:\Program Files\Tencent\微信 web 开发者工具\cli.exe" (
    echo 找到工具：C:\Program Files\Tencent\微信 web 开发者工具
    start "" "C:\Program Files\Tencent\微信 web 开发者工具\cli.exe" open "%PROJECT%"
    goto :success
)

if exist "D:\微信 web 开发者工具\cli.exe" (
    echo 找到工具：D:\微信 web 开发者工具
    start "" "D:\微信 web 开发者工具\cli.exe" open "%PROJECT%"
    goto :success
)

echo 未找到微信开发者工具 CLI
echo.
echo 请手动操作:
echo 1. 打开微信开发者工具
echo 2. 导入项目：%PROJECT%
echo 3. AppID: %APPID%
echo.
pause
exit /b 1

:success
echo.
echo ====================================
echo   启动成功！
echo ====================================
echo.
echo 请在微信开发者工具中:
echo   1. 等待编译完成
echo   2. 查看模拟器
echo   3. 点击"真机调试"测试
echo.
echo 按任意键打开项目文件夹，或关闭窗口继续...
pause >nul
explorer "%PROJECT%"
exit /b 0
