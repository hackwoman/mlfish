@echo off
chcp 65001
echo 正在启动微信开发者工具...
echo 项目路径：D:\fish\miniprogram
echo.

REM 尝试多个可能的安装路径
set "WECHAT_PATHS=C:\Program Files (x86)\Tencent\微信 web 开发者工具;C:\Program Files\Tencent\微信 web 开发者工具;D:\微信 web 开发者工具"

for %%P in (%WECHAT_PATHS%) do (
    if exist "%%P\cli.exe" (
        echo 找到微信开发者工具：%%P
        start "" "%%P\cli.exe" open "D:\fish\miniprogram"
        goto :end
    )
)

echo 未找到微信开发者工具，请手动打开项目
echo 项目路径：D:\fish\miniprogram
pause

:end
