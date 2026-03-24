// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { action } = event;
  
  // 清除预约数据
  if (action === 'clearBookings') {
    try {
      // 先获取所有预约记录
      const countResult = await db.collection('bookings').count();
      const total = countResult.total;
      
      if (total === 0) {
        return { success: true, message: '没有预约数据需要清除' };
      }
      
      // 分批删除，每次最多10条
      const batch = 10;
      const tasks = [];
      for (let i = 0; i < total; i += batch) {
        const res = await db.collection('bookings').skip(i).limit(batch).get();
        const deleteTasks = res.data.map(item => {
          return db.collection('bookings').doc(item._id).remove();
        });
        tasks.push(...deleteTasks);
      }
      
      await Promise.all(tasks);
      
      return { success: true, message: `已清除 ${total} 条预约数据` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  
  // 默认操作：检查并创建集合
  const collections = ['users', 'bookings', 'trips', 'activityTemplates'];
  const results = [];
  
  for (const name of collections) {
    try {
      await db.collection(name).limit(1).get();
      results.push({ name, status: 'exists' });
    } catch (err) {
      if (err.errCode === -502001) {
        try {
          await db.createCollection(name);
          results.push({ name, status: 'created' });
        } catch (createErr) {
          results.push({ name, status: 'error', message: createErr.message });
        }
      } else {
        results.push({ name, status: 'error', message: err.message });
      }
    }
  }
  
  return {
    success: true,
    results
  };
};
