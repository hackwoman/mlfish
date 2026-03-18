// bookings.js
const app = getApp();
const bookingService = require('../../services/bookingService');

Page({
  data: {
    isLoggedIn: false,
    currentTab: 0,
    bookings: []
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadBookings();
  },

  onShow() {
    this.checkLoginStatus();
    this.loadBookings();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const bookingPhone = wx.getStorageSync('bookingPhone');
    this.setData({ 
      isLoggedIn: !!userInfo,
      bookingPhone: bookingPhone || ''
    });
  },

  loadBookings() {
    const userInfo = wx.getStorageSync('userInfo');
    const bookingPhone = wx.getStorageSync('bookingPhone');
    const phone = bookingPhone || userInfo?.phone;
    
    if (!phone) {
      console.log('[预约列表] 未找到用户手机号');
      this.setData({ bookings: [] });
      return;
    }
    
    console.log('[预约列表] 开始加载预约, phone:', phone);
    
    const app = getApp();
    app.showLoading('加载中...');
    
    // 从云数据库获取预约
    bookingService.getBookingsByPhone(phone).then(bookings => {
      app.hideLoading();
      console.log('[预约列表] 获取到的预约:', bookings);
      
      // 格式化预约数据
      const formattedBookings = bookings.map(b => {
        // 解析日期
        let dateText = '';
        if (b.dateText) {
          dateText = b.dateText;
        } else if (b.activityDate) {
          const date = new Date(b.activityDate.replace(/-/g, '/'));
          const month = date.getMonth() + 1;
          const day = date.getDate();
          const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          const weekDay = weekDays[date.getDay()];
          dateText = `${month}月${day}日（${weekDay}）`;
        }
        
        // 状态处理
        let statusClass = 'pending';
        let statusText = '待出行';
        let status = 1;
        
        if (b.status === 'canceled' || b.status === 'cancelled') {
          statusClass = 'canceled';
          statusText = '已取消';
          status = 0;
        } else if (b.status === 'completed') {
          statusClass = 'completed';
          statusText = '已完成';
          status = 2;
        } else if (b.status === 'confirmed' || b.status === 'pending') {
          statusClass = 'pending';
          statusText = '待出行';
          status = 1;
        }
        
        return {
          _id: b._id,
          id: b._id,
          title: b.activityTitle || '海钓活动',
          date: dateText,
          people: b.people || 1,
          price: b.price || 0,
          status: status,
          statusClass: statusClass,
          statusText: statusText,
          phone: b.phone,
          activityId: b.activityId,
          activityDate: b.activityDate
        };
      });
      
      this.setData({ bookings: formattedBookings });
    }).catch(e => {
      app.hideLoading();
      console.error('[预约列表] 获取预约失败:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  switchTab(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ currentTab: idx });
    
    // 实际项目中应该根据状态筛选
    this.loadBookings();
  },

  async cancel(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消该预约吗？',
      success: async res => {
        if (res.confirm) {
          try {
            const app = getApp();
            await app.cancelBooking(id);
            wx.showToast({
              title: '已取消',
              icon: 'success'
            });
            this.loadBookings();
          } catch (err) {
            console.error('取消失败:', err);
            wx.showToast({
              title: '取消失败',
              icon: 'none'
            });
          }
        }
      }
    });
  }
});
