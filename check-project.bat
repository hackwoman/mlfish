@echo off
chcp 65001 >nul
echo ====================================
echo   魅力海钓小程序 - 项目完整性检查
echo ====================================
echo.

set PROJECT_PATH=D:\fish\miniprogram
set ERRORS=0

REM 检查核心文件
echo [检查核心文件]
for %%F in (app.js app.json app.wxss project.config.json sitemap.json) do (
    if exist "%PROJECT_PATH%\%%F" (
        echo   [✓] %%F
    ) else (
        echo   [×] %%F - 缺失
        set /a ERRORS+=1
    )
)

echo.
echo [检查页面目录]

REM 检查主包页面
for %%D in (index profile) do (
    if exist "%PROJECT_PATH%\pages\%%D\index.js" (
        echo   [✓] pages/%%D/
    ) else if exist "%PROJECT_PATH%\pages\%%D\%%D.js" (
        echo   [✓] pages/%%D/
    ) else (
        echo   [×] pages/%%D/ - 页面文件缺失
        set /a ERRORS+=1
    )
)

REM 检查分包页面
if exist "%PROJECT_PATH%\pages\activity\list.js" (
    echo   [✓] pages/activity/ (分包)
) else (
    echo   [×] pages/activity/ - 缺失
    set /a ERRORS+=1
)

for %%D in (profile detail admin) do (
    if exist "%PROJECT_PATH%\packages\%%D" (
        echo   [✓] packages/%%D/ (分包)
    ) else (
        echo   [×] packages/%%D/ - 缺失
        set /a ERRORS+=1
    )
)

echo.
echo [检查工具类]
for %%F in (api.js auth.js constants.js util.js) do (
    if exist "%PROJECT_PATH%\utils\%%F" (
        echo   [✓] utils\%%F
    ) else (
        echo   [×] utils\%%F - 缺失
        set /a ERRORS+=1
    )
)

echo.
echo [检查服务类]
for %%F in (bookingService.js tripService.js userService.js) do (
    if exist "%PROJECT_PATH%\services\%%F" (
        echo   [✓] services\%%F
    ) else (
        echo   [×] services\%%F - 缺失
        set /a ERRORS+=1
    )
)

echo.
echo ====================================
if %ERRORS%==0 (
    echo   检查完成：所有文件完整 ✓
    echo ====================================
    echo.
    echo 项目配置信息:
    echo   AppID: wx504a5b83dba5ce0b
    echo   云环境：cloud1-3g3ropz587d6e804
    echo   基础库版本：3.15.0
    echo.
) else (
    echo   检查完成：发现 %ERRORS% 个错误 ×
    echo ====================================
)

echo.
pause
