@echo off
chcp 65001 >nul 2>&1
title 图片优化脚本

echo ====================================
echo   魅力海钓 - 图片优化脚本
echo ====================================
echo.
echo 当前问题:
echo   - images 目录为空
echo   - images-backup 有 5.4M 未压缩图片
echo.
echo 解决方案:
echo   1. 使用云存储图片（推荐）
echo   2. 压缩后放入 images 目录
echo.
echo 正在检查 Node.js...
echo.

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未找到 Node.js
    echo.
    echo 请先安装 Node.js 或手动处理图片:
    echo   1. 访问 https://tinypng.com/ 压缩图片
    echo   2. 将压缩后的图片放入 images 目录
    echo.
    pause
    exit /b 1
)

echo [✓] Node.js 已安装
echo.
echo 正在安装 sharp 库...
call npm install sharp 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 安装 sharp 失败
    pause
    exit /b 1
)

echo.
echo 正在压缩图片...
node compress-images.js

echo.
echo ====================================
echo 完成！
echo ====================================
echo.
pause
