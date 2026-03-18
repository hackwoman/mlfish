// 在微信开发者工具控制台执行此代码检查活动列表

console.log('=== 活动列表调试 ===\n');

// 1. 检查当前页面
const pages = getCurrentPages();
console.log('当前页面栈:', pages.map(p => p.route));

// 2. 检查活动列表页
const activityPage = pages.find(p => p.route === 'pages/activity/list');
if (activityPage) {
  console.log('✓ 活动列表页存在');
  console.log('  activities 长度:', activityPage.data.activities.length);
  console.log('  activities:', activityPage.data.activities);
} else {
  console.log('✗ 活动列表页不存在');
}

// 3. 检查云数据库
wx.cloud.database().collection('bookings').get().then(res => {
  console.log('\n云数据库 bookings:');
  console.log('  总记录数:', res.data.length);
  
  // 按日期分组
  const byDate = {};
  res.data.forEach(b => {
    const date = b.activityDate || b.date;
    if (date) {
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(b);
    }
  });
  
  console.log('  按日期分组:');
  for (const date in byDate) {
    const totalPeople = byDate[date].reduce((sum, b) => sum + (b.people || 1), 0);
    console.log(`    ${date}: ${byDate[date].length}条预约，${totalPeople}人`);
  }
}).catch(err => {
  console.error('查询失败:', err);
});

console.log('\n=== 调试完成 ===');
