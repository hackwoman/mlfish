// 云开发环境检查脚本
// 在微信开发者工具控制台中运行此代码

console.log('=== 云开发环境检查 ===\n');

// 1. 检查 wx.cloud 是否可用
if (typeof wx !== 'undefined' && wx.cloud) {
  console.log('✓ wx.cloud 可用');
} else {
  console.log('✗ wx.cloud 不可用');
}

// 2. 检查当前环境
const app = getApp();
console.log('配置的环境 ID:', app.globalData.cloudEnv);

// 3. 测试数据库连接
function testDB() {
  try {
    const db = wx.cloud.database();
    console.log('✓ 数据库初始化成功');
    
    // 测试查询 users 集合
    db.collection('users').limit(1).get().then(res => {
      console.log('✓ users 集合可访问，数据条数:', res.data.length);
    }).catch(err => {
      console.log('✗ users 集合访问失败:', err);
    });
  } catch (e) {
    console.log('✗ 数据库初始化失败:', e);
  }
}

// 4. 运行测试
setTimeout(testDB, 1000);

console.log('\n=== 检查完成 ===');
