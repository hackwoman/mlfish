@echo off
chcp 65001 >nul 2>&1
title 清理调试文件

echo ====================================
echo   清理调试文件
echo ====================================
echo.
echo 将删除以下文件:
echo   - *.bat (批处理脚本)
echo   - *.ps1 (PowerShell 脚本)
echo   - *-*.md (调试文档)
echo   - optimize-images.bat
echo.
echo 保留:
echo   - project.config.json
echo   - 源代码文件
echo   - 必要配置
echo.

set /p CONFIRM="确认清理？(Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo.
    echo 已取消
    pause
    exit /b 1
)

echo.
echo 正在清理...

del /q *.bat 2>nul
del /q *.ps1 2>nul
del /q *-*.md 2>nul
del /q optimize-images.bat 2>nul

echo.
echo ====================================
echo   清理完成!
echo ====================================
echo.
echo 项目已准备好上传/分享
echo.
pause
