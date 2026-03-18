@echo off
chcp 65001 >nul
echo ====================================
echo   云开发环境配置工具
echo ====================================
echo.
echo 当前配置:
echo   AppID: wx504a5b83dba5ce0b
echo   云环境：cloud1-3g3ropz587d6e804
echo.
echo 请按以下步骤操作:
echo.
echo 1. 打开微信开发者工具
echo 2. 点击"云开发"按钮
echo 3. 查看你的环境 ID
echo.
echo 如果环境 ID 不同，请修改 app.js:
echo   globalData: {
echo     cloudEnv: '你的环境 ID'
echo   }
echo.
echo 然后创建以下数据库集合:
echo   - users
echo   - bookings
echo   - trips
echo   - activityTemplates
echo.
pause
