# Charm Fishing Miniprogram Launcher
$projectPath = "D:\fish\miniprogram"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Charm Fishing Miniprogram" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project: $projectPath" -ForegroundColor Yellow
Write-Host ""

# Find WeChat DevTools
$paths = @(
    "C:\Program Files (x86)\Tencent\微信 web 开发者工具\cli.exe",
    "C:\Program Files\Tencent\微信 web 开发者工具\cli.exe",
    "D:\微信 web 开发者工具\cli.exe"
)

$found = $false
foreach ($p in $paths) {
    if (Test-Path $p) {
        Write-Host "Found: $p" -ForegroundColor Green
        Write-Host "Starting..." -ForegroundColor Green
        Start-Process $p -ArgumentList @("open", $projectPath)
        $found = $true
        break
    }
}

if (-not $found) {
    Write-Host "CLI not found. Please open WeChat DevTools manually." -ForegroundColor Red
    Write-Host "Import project: $projectPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
