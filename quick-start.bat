@echo off
chcp 65001 >nul
echo ====================================
echo   魅力海钓小程序 - 自动检测与启动
echo ====================================
echo.

set PROJECT_PATH=D:\fish\miniprogram

REM 检查项目是否存在
if not exist "%PROJECT_PATH%\app.json" (
    echo [错误] 项目路径不存在：%PROJECT_PATH%
    pause
    exit /b 1
)
echo [✓] 项目配置文件存在

REM 检查必要文件
for %%F in (app.js app.json project.config.json) do (
    if exist "%PROJECT_PATH%\%%F" (
        echo [✓] %%F 存在
    ) else (
        echo [×] %%F 缺失
    )
)

echo.
echo 正在查找微信开发者工具...
echo.

REM 查找微信开发者工具
set "CLI_PATH="
if exist "C:\Program Files (x86)\Tencent\微信 web 开发者工具\cli.exe" (
    set "CLI_PATH=C:\Program Files (x86)\Tencent\微信 web 开发者工具\cli.exe"
)
if exist "C:\Program Files\Tencent\微信 web 开发者工具\cli.exe" (
    set "CLI_PATH=C:\Program Files\Tencent\微信 web 开发者工具\cli.exe"
)
if exist "D:\微信 web 开发者工具\cli.exe" (
    set "CLI_PATH=D:\微信 web 开发者工具\cli.exe"
)

if "%CLI_PATH%"=="" (
    echo [错误] 未找到微信开发者工具
    echo.
    echo 请手动打开微信开发者工具并导入项目：
    echo   路径：%PROJECT_PATH%
    echo   AppID: wx504a5b83dba5ce0b
    echo.
    set /p OPEN="是否打开项目文件夹？(Y/N): "
    if /i "%OPEN%"=="Y" explorer "%PROJECT_PATH%"
    pause
    exit /b 1
)

echo [✓] 找到微信开发者工具：%CLI_PATH%
echo.
echo 正在启动微信开发者工具...
echo.

start "" "%CLI_PATH%" open "%PROJECT_PATH%"

echo [✓] 已启动微信开发者工具
echo.
echo ====================================
echo   项目已打开，请在微信开发者工具中查看
echo ====================================
echo.
pause
