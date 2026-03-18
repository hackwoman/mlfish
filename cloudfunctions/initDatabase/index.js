// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
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
