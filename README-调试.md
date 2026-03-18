# 魅力海钓小程序 - 开发调试说明

## 📁 项目位置
```
D:\fish\miniprogram
```

## 🚀 快速启动（3 种方式）

### 方式一：双击启动（最简单）
在 Windows 资源管理器中，双击以下文件：
```
启动调试.bat
```

### 方式二：PowerShell 启动
右键点击 `debug-launcher.ps1`，选择"使用 PowerShell 运行"

### 方式三：手动打开
1. 打开微信开发者工具
2. 点击"+"导入项目
3. 选择目录：`D:\fish\miniprogram`
4. AppID 自动识别：`wx504a5b83dba5ce0b`

## ✅ 项目检查结果

所有必要文件已检查通过：
- ✓ 核心文件（app.js, app.json, app.wxss）
- ✓ 页面目录（index, profile, activity）
- ✓ 分包目录（packages/profile, packages/detail, packages/admin）
- ✓ 工具模块（utils/api.js, utils/auth.js 等）
- ✓ 服务模块（services/bookingService.js 等）

## 📋 项目配置

| 配置项 | 值 |
|--------|-----|
| AppID | wx504a5b83dba5ce0b |
| 云环境 | cloud1-3g3ropz587d6e804 |
| 基础库 | 3.15.0 |

## 🔧 调试步骤

1. **启动工具**
   - 双击 `启动调试.bat`

2. **等待编译**
   - 工具会自动编译项目
   - 查看控制台是否有错误

3. **模拟器测试**
   - 在模拟器中查看小程序效果
   - 测试各个页面功能

4. **真机调试**
   - 点击工具栏"真机调试"
   - 微信扫码登录
   - 在手机上测试

5. **云开发调试**
   - 点击"云开发"按钮
   - 查看数据库数据
   - 检查云函数

## 📱 主要功能

- 首页：海钓项目展示
- 个人中心：订单管理、会员信息
- 活动列表：活动报名
- 管理后台：后台管理

## ⚠️ 常见问题

**Q: 找不到微信开发者工具？**
A: 确保已安装微信开发者工具，可从官网下载

**Q: AppID 无效？**
A: 确保登录的微信开发者账号有权限使用该 AppID

**Q: 云开发连接失败？**
A: 检查云环境 ID 是否正确：`cloud1-3g3ropz587d6e804`

## 📂 辅助文件说明

- `启动调试.bat` - 一键启动脚本
- `debug-launcher.ps1` - PowerShell 启动器
- `quick-start.bat` - 快速启动（备用）
- `check-project.bat` - 项目检查工具
- `项目状态报告.md` - 详细项目报告
- `开发调试指南.md` - 完整开发指南

---

**准备就绪！** 双击 `启动调试.bat` 开始调试
