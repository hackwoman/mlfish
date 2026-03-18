// ========================================
// 在微信开发者工具控制台执行此代码
// ========================================

console.log('\n=== 云开发诊断 ===\n');

const app = getApp();

// 1. 基础检查
console.log('1. wx.cloud 存在:', typeof wx.cloud !== 'undefined' ? '✓' : '✗');
console.log('2. 配置的环境 ID:', app.globalData.cloudEnv);

// 2. 数据库测试
const db = wx.cloud.database();
console.log('3. 数据库初始化:', db ? '✓' : '✗');

// 3. 集合访问测试
db.collection('users').limit(1).get()
  .then(res => {
    console.log('\n=== 数据库测试成功 ===');
    console.log('4. users 集合可访问: ✓');
    console.log('5. 当前数据条数:', res.data.length);
    if (res.data.length > 0) {
      console.log('6. 第一条数据:', res.data[0]);
    }
  })
  .catch(err => {
    console.log('\n=== 数据库测试失败 ===');
    console.log('4. users 集合访问: ✗');
    console.log('错误码:', err.errCode);
    console.log('错误信息:', err.errMsg);
    console.log('\n请截图此错误信息');
  });

// 4. 检查当前用户
const userInfo = wx.getStorageSync('userInfo');
console.log('\n7. 本地用户数据:', userInfo ? '存在' : '不存在');
