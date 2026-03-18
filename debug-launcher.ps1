# 魅力海钓小程序 - 自动调试启动器
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  魅力海钓小程序 - 开发调试工具" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "D:\fish\miniprogram"
$appId = "wx504a5b83dba5ce0b"
$cloudEnv = "cloud1-3g3ropz587d6e804"

# 项目检查
Write-Host "[项目检查]" -ForegroundColor Yellow

$requiredFiles = @(
    "app.js",
    "app.json",
    "app.wxss",
    "project.config.json"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    $path = Join-Path $projectPath $file
    if (Test-Path $path) {
        Write-Host "  [✓] $file" -ForegroundColor Green
    } else {
        Write-Host "  [×] $file - 缺失" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""

if (-not $allFilesExist) {
    Write-Host "[错误] 项目文件不完整，无法启动" -ForegroundColor Red
    Write-Host "按回车键退出..."
    Read-Host
    exit 1
}

# 查找微信开发者工具
Write-Host "[查找微信开发者工具]" -ForegroundColor Yellow

$possiblePaths = @(
    "C:\Program Files (x86)\Tencent\微信 web 开发者工具\cli.exe",
    "C:\Program Files\Tencent\微信 web 开发者工具\cli.exe",
    "D:\微信 web 开发者工具\cli.exe"
)

$cliPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $cliPath = $path
        Write-Host "  [✓] $path" -ForegroundColor Green
        break
    } else {
        Write-Host "  [×] $path" -ForegroundColor Gray
    }
}

Write-Host ""

if (-not $cliPath) {
    Write-Host "[错误] 未找到微信开发者工具" -ForegroundColor Red
    Write-Host ""
    Write-Host "请手动打开微信开发者工具并导入项目：" -ForegroundColor Yellow
    Write-Host "  项目路径：$projectPath" -ForegroundColor White
    Write-Host "  AppID: $appId" -ForegroundColor White
    Write-Host "  云环境：$cloudEnv" -ForegroundColor White
    Write-Host ""
    
    $open = Read-Host "是否打开项目文件夹？(Y/N)"
    if ($open -eq 'Y' -or $open -eq 'y') {
        Invoke-Item $projectPath
    }
    
    Write-Host "按回车键退出..."
    Read-Host
    exit 1
}

# 启动微信开发者工具
Write-Host ""
Write-Host "[启动微信开发者工具]" -ForegroundColor Yellow
Write-Host "  项目路径：$projectPath" -ForegroundColor White
Write-Host "  AppID: $appId" -ForegroundColor White
Write-Host ""

try {
    Start-Process $cliPath -ArgumentList @("open", $projectPath) -WindowStyle Hidden
    Write-Host "[✓] 微信开发者工具已启动" -ForegroundColor Green
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "  请在微信开发者工具中进行以下操作:" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "  1. 等待项目编译完成" -ForegroundColor White
    Write-Host "  2. 查看模拟器中的小程序" -ForegroundColor White
    Write-Host "  3. 点击'真机调试'进行真机测试" -ForegroundColor White
    Write-Host "  4. 打开'调试器'查看控制台日志" -ForegroundColor White
    Write-Host "  5. 点击'云开发'查看云数据库" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[错误] 启动失败：$($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "请手动打开微信开发者工具" -ForegroundColor Yellow
}

Write-Host "按回车键退出..."
Read-Host
