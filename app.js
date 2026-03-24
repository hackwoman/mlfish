// app.js
const { api } = require('./utils/api');
const auth = require('./utils/auth');
const bookingService = require('./services/bookingService');
const CONSTANTS = require('./utils/constants');

App({
  globalData: {
    userInfo: null,
    isLogin: false,
    memberLevel: 0,
    cloudEnv: 'cloud1-3g3ropz587d6e804'
  },

  onLaunch() {
    this.initCloud();
    this.initAuth();
  },

  initCloud() {
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.cloudEnv,
        traceUser: true
      });
    }
  },

  initAuth() {
    auth.checkLoginStatus();
    const userInfo = wx.getStorageSync(CONSTANTS.STORAGE_KEYS.USER_INFO);
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLogin = true;
      this.globalData.memberLevel = userInfo.memberLevel || 0;
    }
  },

  getDB() {
    return api.getDB();
  },

  async loginWithPhone(phone, password, name) {
    return await auth.loginOrRegister(phone, password, name);
  },

  async checkLoginStatus() {
    return auth.checkLoginStatus();
  },

  async refreshUserInfo() {
    return await auth.refreshUserInfo();
  },

  async cancelBooking(bookingId) {
    return await bookingService.cancelBooking(bookingId);
  },

  async createBooking(bookingData) {
    return await bookingService.createBooking(bookingData);
  },

  async getBookingsByPhone(phone) {
    return await bookingService.getBookingsByPhone(phone);
  },

  checkAuth() {
    return auth.checkAuth();
  },

  isAdmin() {
    return auth.isAdmin();
  },

  logout() {
    auth.logout();
  },

  getDiscount() {
    const level = this.globalData.memberLevel;
    const discounts = [1, 0.9, 0.7];
    return discounts[level] || 1;
  },

  getDiscountText() {
    const level = this.globalData.memberLevel;
    const texts = ['标准价', '9折', '7折'];
    return texts[level] || '标准价';
  },

  showLoading(title = '加载中...') {
    wx.showLoading({ title, mask: true });
  },

  hideLoading() {
    wx.hideLoading();
  },

  showToast(title, icon = 'none') {
    wx.showToast({ title, icon });
  },
  
  // 清除本地预约数据（保留用户数据）
  clearLocalBookings() {
    const keys = wx.getStorageInfoSync().keys;
    const bookingKeys = keys.filter(key => 
      key.startsWith('booking_') || 
      key === 'allBookings' || 
      key === 'trips' ||
      key === 'bookingPhone'
    );
    
    bookingKeys.forEach(key => {
      wx.removeStorageSync(key);
    });
    
    console.log(`已清除本地预约数据: ${bookingKeys.length} 个键`);
    return bookingKeys.length;
  },
  
  // 清除云数据库预约数据（需管理员权限）
  async clearCloudBookings() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'initDatabase',
        data: { action: 'clearBookings' }
      });
      console.log('清除云数据库预约结果:', result);
      return result.result;
    } catch (err) {
      console.error('清除云数据库预约失败:', err);
      return { success: false, error: err.message };
    }
  }
});
