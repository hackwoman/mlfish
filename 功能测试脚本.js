// ============================================
// 小程序功能遍历测试脚本
// 在微信开发者工具控制台执行
// ============================================

console.log('\n');
console.log('='.repeat(50));
console.log('  魅力海钓小程序 - 功能遍历测试');
console.log('='.repeat(50));
console.log('\n');

const results = [];

// 测试 1: 云开发初始化
function testCloud() {
  console.log('[测试 1] 云开发初始化...');
  try {
    if (wx.cloud) {
      console.log('  ✓ wx.cloud 可用');
      const db = wx.cloud.database();
      console.log('  ✓ 数据库对象创建成功');
      results.push({name: '云开发', status: 'pass'});
    } else {
      console.log('  ✗ wx.cloud 不可用');
      results.push({name: '云开发', status: 'fail'});
    }
  } catch (e) {
    console.log('  ✗ 错误:', e.message);
    results.push({name: '云开发', status: 'fail', error: e.message});
  }
}

// 测试 2: 用户登录状态
function testAuth() {
  console.log('\n[测试 2] 用户登录状态...');
  const userInfo = wx.getStorageSync('userInfo');
  const bookingPhone = wx.getStorageSync('bookingPhone');
  
  if (userInfo) {
    console.log('  ✓ 已登录');
    console.log('    - 用户 ID:', userInfo._id);
    console.log('    - 姓名:', userInfo.name);
    console.log('    - 手机:', userInfo.phone);
    console.log('    - 会员等级:', userInfo.memberLevel);
    results.push({name: '登录状态', status: 'pass', user: userInfo.name});
  } else {
    console.log('  ✗ 未登录');
    results.push({name: '登录状态', status: 'fail'});
  }
}

// 测试 3: 云数据库连接
async function testDatabase() {
  console.log('\n[测试 3] 云数据库连接...');
  try {
    const db = wx.cloud.database();
    
    // 测试 users 集合
    const usersRes = await db.collection('users').limit(1).get();
    console.log('  ✓ users 集合可访问，数据条数:', usersRes.data.length);
    
    // 测试 bookings 集合
    const bookingsRes = await db.collection('bookings').limit(1).get();
    console.log('  ✓ bookings 集合可访问，数据条数:', bookingsRes.data.length);
    
    // 测试 trips 集合
    const tripsRes = await db.collection('trips').limit(1).get();
    console.log('  ✓ trips 集合可访问，数据条数:', tripsRes.data.length);
    
    results.push({name: '数据库连接', status: 'pass'});
  } catch (e) {
    console.log('  ✗ 错误:', e.message);
    console.log('  错误码:', e.errCode);
    results.push({name: '数据库连接', status: 'fail', error: e.message});
  }
}

// 测试 4: 预约服务
async function testBookingService() {
  console.log('\n[测试 4] 预约服务...');
  try {
    const bookingService = require('./services/bookingService');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (userInfo && userInfo.phone) {
      const bookings = await bookingService.getBookingsByPhone(userInfo.phone);
      console.log('  ✓ 获取用户预约成功，条数:', bookings.length);
      if (bookings.length > 0) {
        console.log('    - 第一条预约:', bookings[0].activityDate || bookings[0].date);
      }
      results.push({name: '预约服务', status: 'pass', count: bookings.length});
    } else {
      console.log('  ⚠ 无用户信息，跳过测试');
      results.push({name: '预约服务', status: 'skip'});
    }
  } catch (e) {
    console.log('  ✗ 错误:', e.message);
    results.push({name: '预约服务', status: 'fail', error: e.message});
  }
}

// 测试 5: 页面导航
function testNavigation() {
  console.log('\n[测试 5] 页面导航配置...');
  const app = getApp();
  if (app && app.globalData) {
    console.log('  ✓ App 实例可用');
    console.log('  ✓ 云环境:', app.globalData.cloudEnv);
    results.push({name: 'App 实例', status: 'pass'});
  } else {
    console.log('  ✗ App 实例不可用');
    results.push({name: 'App 实例', status: 'fail'});
  }
}

// 测试 6: 本地存储
function testStorage() {
  console.log('\n[测试 6] 本地存储...');
  const keys = ['userInfo', 'bookingPhone', 'allBookings', 'trips'];
  let allOk = true;
  
  keys.forEach(key => {
    const val = wx.getStorageSync(key);
    if (val !== undefined && val !== null) {
      console.log('  ✓', key, '- 存在');
    } else {
      console.log('  ○', key, '- 空');
    }
  });
  
  results.push({name: '本地存储', status: 'pass'});
}

// 执行所有测试
async function runAllTests() {
  testCloud();
  testAuth();
  await testDatabase();
  await testBookingService();
  testNavigation();
  testStorage();
  
  // 输出总结
  console.log('\n');
  console.log('='.repeat(50));
  console.log('  测试总结');
  console.log('='.repeat(50));
  
  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const skipCount = results.filter(r => r.status === 'skip').length;
  
  console.log('\n');
  console.log('通过:', passCount, '✓');
  console.log('失败:', failCount, '✗');
  console.log('跳过:', skipCount, '○');
  console.log('\n');
  
  if (failCount > 0) {
    console.log('失败项:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log('  -', r.name, ':', r.error);
    });
  }
  
  console.log('\n');
  console.log('请截图此输出发送给开发者');
  console.log('\n');
}

// 启动测试
runAllTests().catch(console.error);
