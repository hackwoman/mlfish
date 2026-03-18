// activity.js - 从云数据库加载活动
const bookingService = require('../../services/bookingService');

Page({
  data: {
    isLoggedIn: false,
    activities: [],
    trips: {}
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadActivities();
  },

  onShow() {
    this.checkLoginStatus();
    this.loadActivities();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({ isLoggedIn: !!userInfo });
  },

  async loadActivities() {
    console.log('[活动列表] onShow 触发，开始加载活动...');
    console.log('[活动列表] 开始加载活动');
    
    console.log('[活动列表] 当前 data.activities 长度：', this.data.activities.length);
    // 从云数据库获取预约统计
    let bookingsByDate = {};
    try {
      bookingsByDate = await bookingService.getBookingsGroupByDate();
      console.log('[活动列表] 获取到预约数据:', bookingsByDate);
    } catch (e) {
      console.error('[活动列表] 获取云端预约数据失败:', e);
      bookingsByDate = wx.getStorageSync('allBookings') || {};
    }
    
    const trips = wx.getStorageSync('trips') || {};
    this.setData({ trips });
    
    const activities = [];
    
    // 遍历所有有预约的日期
    for (const date in bookingsByDate) {
      const bookings = bookingsByDate[date];
      const totalPeople = bookings.reduce((sum, b) => sum + (b.people || 1), 0);
      
      console.log('[活动列表] 日期:', date, '人数:', totalPeople, '预约数:', bookings.length);
      
      const trip = trips[date];
      const activity = trip?.activity || null;
      
      // 格式化日期为 "3 月 15 日" 格式
      const dateParts = date.split('-');
      const month = parseInt(dateParts[1]);
      const day = parseInt(dateParts[2]);
      const displayDate = `${month}月${day}日`;
      
      // 计算状态
      let statusClass = 'tag-success';
      let statusText = '报名中';
      
      if (trip?.status === 'ongoing') {
        statusClass = 'tag-info';
        statusText = '进行中';
      } else if (totalPeople >= (activity?.maxPeople || 6)) {
        statusClass = 'tag-danger';
        statusText = '已满员';
      } else if (totalPeople >= 4) {
        statusClass = 'tag-warning';
        statusText = `${totalPeople}/4 人`;
      }
      
      activities.push({
        id: date.replace(/-/g, ''),
        title: activity?.title || '海钓活动',
        description: activity?.description || '大鹏湾海钓体验',
        date: displayDate,
        fullDate: date,
        icon: '🚤',
        coverColor: this.getRandomColor(),
        current: totalPeople,
        max: activity?.maxPeople || 6,
        price: activity?.price || 599,
        statusClass: statusClass,
        statusText: statusText,
        hasActivity: !!activity
      });
    }
    
    // 按日期排序
    activities.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
    
    console.log('[活动列表] 活动数量:', activities.length);
    this.setData({ activities });
  },

  // 获取随机颜色
  getRandomColor() {
    const colors = ['#667eea', '#11998e', '#ee0979', '#f5a623', '#159895', '#e74c3c'];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    const activity = this.data.activities.find(a => a.id === id);
    wx.navigateTo({
      url: `/packages/detail/index?id=${id}&date=${activity?.fullDate}`
    });
  }
});
