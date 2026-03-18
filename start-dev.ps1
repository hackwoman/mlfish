# 微信开发者工具自动启动脚本
$projectPath = "D:\fish\miniprogram"

# 可能的安装路径
$possiblePaths = @(
    "C:\Program Files (x86)\Tencent\微信 web 开发者工具\cli.exe",
    "C:\Program Files\Tencent\微信 web 开发者工具\cli.exe",
    "D:\微信 web 开发者工具\cli.exe"
)

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  魅力海钓小程序 - 开发调试启动器" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "项目路径：$projectPath" -ForegroundColor Yellow
Write-Host ""

# 查找微信开发者工具
$cliPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $cliPath = $path
        Write-Host "[✓] 找到微信开发者工具：$path" -ForegroundColor Green
        break
    } else {
        Write-Host "[×] 未找到：$path" -ForegroundColor Gray
    }
}

Write-Host ""

if ($cliPath) {
    Write-Host "正在启动微信开发者工具..." -ForegroundColor Green
    Start-Process $cliPath -ArgumentList @("open", $projectPath) -WindowStyle Hidden
    Write-Host "启动成功！" -ForegroundColor Green
} else {
    Write-Host "[错误] 未找到微信开发者工具 CLI" -ForegroundColor Red
    Write-Host ""
    Write-Host "请手动打开微信开发者工具，然后导入项目：" -ForegroundColor Yellow
    Write-Host "  1. 打开微信开发者工具" -ForegroundColor White
    Write-Host "  2. 点击 '+' 导入项目" -ForegroundColor White
    Write-Host "  3. 选择目录：$projectPath" -ForegroundColor White
    Write-Host "  4. AppID 已配置为：wx504a5b83dba5ce0b" -ForegroundColor White
    Write-Host ""
    
    # 尝试打开项目文件夹
    $open = Read-Host "是否打开项目文件夹？(Y/N)"
    if ($open -eq 'Y' -or $open -eq 'y') {
        Invoke-Item $projectPath
    }
}

Write-Host ""
Read-Host "按回车键退出"
