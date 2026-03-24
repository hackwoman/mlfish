const CONSTANTS = require('./constants');

const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr) => {
  const parts = dateStr.split('-');
  return `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
};

const getLevelName = (level) => {
  const levelData = CONSTANTS.MEMBER_LEVELS.find(l => l.level === level);
  return levelData ? levelData.name : '普通会员';
};

const getDiscount = (level) => {
  const levelData = CONSTANTS.MEMBER_LEVELS.find(l => l.level === level);
  return levelData ? levelData.discount : 1;
};

const getDiscountText = (level) => {
  const levelData = CONSTANTS.MEMBER_LEVELS.find(l => l.level === level);
  return levelData ? levelData.discountText : '标准价';
};

const getDiscountNum = (level) => {
  const levelData = CONSTANTS.MEMBER_LEVELS.find(l => l.level === level);
  return levelData ? levelData.discount * 10 : 10;
};

const getRandomColor = () => {
  return CONSTANTS.COLORS[Math.floor(Math.random() * CONSTANTS.COLORS.length)];
};

const showLoading = (title = '加载中...') => {
  wx.showLoading({ title, mask: true });
};

const hideLoading = () => {
  wx.hideLoading();
};

const showToast = (title, icon = 'none') => {
  wx.showToast({ title, icon });
};

const showModal = (options) => {
  return new Promise((resolve) => {
    wx.showModal({
      ...options,
      success: resolve
    });
  });
};

const getStorage = (key) => {
  return wx.getStorageSync(key);
};

const setStorage = (key, value) => {
  wx.setStorageSync(key, value);
};

const removeStorage = (key) => {
  wx.removeStorageSync(key);
};

const validatePhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

module.exports = {
  formatDate,
  formatDisplayDate,
  getLevelName,
  getDiscount,
  getDiscountText,
  getDiscountNum,
  getRandomColor,
  showLoading,
  hideLoading,
  showToast,
  showModal,
  getStorage,
  setStorage,
  removeStorage,
  validatePhone,
  validatePassword
};
