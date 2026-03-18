const { api, DB } = require('./api');
const { getStorage, setStorage, removeStorage, validatePhone, validatePassword } = require('./util');
const CONSTANTS = require('./constants');

const getAppInstance = () => {
  return getApp();
};

const checkLoginStatus = () => {
  const userInfo = getStorage(CONSTANTS.STORAGE_KEYS.USER_INFO);
  if (userInfo) {
    const app = getAppInstance();
    if (app && app.globalData) {
      app.globalData.userInfo = userInfo;
      app.globalData.isLogin = true;
    }
  }
  return !!userInfo;
};

const checkAuth = () => {
  const userInfo = getStorage(CONSTANTS.STORAGE_KEYS.USER_INFO);
  if (!userInfo) {
    wx.showModal({
      title: '提示',
      content: '请先登录',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ url: '/pages/profile/index' });
        }
      }
    });
    return false;
  }
  return true;
};

const isAdmin = () => {
  const userRole = getStorage(CONSTANTS.STORAGE_KEYS.USER_ROLE);
  return userRole === 'admin';
};

const login = async (phone, password) => {
  if (!validatePhone(phone)) {
    return { success: false, msg: '请输入正确的手机号' };
  }
  if (!validatePassword(password)) {
    return { success: false, msg: '密码至少 6 位' };
  }

  const users = await api.get(DB.users, { where: { phone } });

  if (users.length === 0) {
    return { success: false, msg: '该手机号未注册，请先注册' };
  }

  const user = users[0];

  if (user.password !== password) {
    return { success: false, msg: '密码错误' };
  }

  setStorage(CONSTANTS.STORAGE_KEYS.USER_INFO, user);
  setStorage(CONSTANTS.STORAGE_KEYS.BOOKING_PHONE, phone);

  const app = getAppInstance();
  if (app && app.globalData) {
    app.globalData.userInfo = user;
    app.globalData.isLogin = true;
    app.globalData.memberLevel = user.memberLevel || 0;
  }

  return { success: true, user };
};

const register = async (phone, password, name) => {
  if (!name || !name.trim()) {
    return { success: false, msg: '请输入姓名' };
  }
  if (!validatePhone(phone)) {
    return { success: false, msg: '请输入正确的手机号' };
  }
  if (!validatePassword(password)) {
    return { success: false, msg: '密码至少 6 位' };
  }

  const users = await api.get(DB.users, { where: { phone } });

  if (users.length > 0) {
    return { success: false, msg: '该手机号已注册，请直接登录' };
  }

  const newUser = {
    phone,
    password,
    name: name.trim(),
    memberLevel: 0,
    points: 100,
    totalBookings: 0
  };

  const result = await api.add(DB.users, newUser);
  newUser._id = result._id;

  setStorage(CONSTANTS.STORAGE_KEYS.USER_INFO, newUser);
  setStorage(CONSTANTS.STORAGE_KEYS.BOOKING_PHONE, phone);

  const app = getAppInstance();
  if (app && app.globalData) {
    app.globalData.userInfo = newUser;
    app.globalData.isLogin = true;
    app.globalData.memberLevel = 0;
  }

  return { success: true, user: newUser, isNew: true };
};

const loginOrRegister = async (phone, password, name) => {
  if (!name) {
    return login(phone, password);
  }
  const loginResult = await login(phone, password);
  if (loginResult.success) {
    return loginResult;
  }
  return register(phone, password, name);
};

const logout = () => {
  removeStorage(CONSTANTS.STORAGE_KEYS.USER_INFO);
  const app = getAppInstance();
  if (app && app.globalData) {
    app.globalData.userInfo = null;
    app.globalData.isLogin = false;
    app.globalData.memberLevel = 0;
  }
};

const refreshUserInfo = async () => {
  const userInfo = getStorage(CONSTANTS.STORAGE_KEYS.USER_INFO);
  if (!userInfo || !userInfo._id) return null;

  try {
    const cloudUser = await api.getById(DB.users, userInfo._id);
    if (cloudUser) {
      setStorage(CONSTANTS.STORAGE_KEYS.USER_INFO, cloudUser);
      const app = getAppInstance();
      if (app && app.globalData) {
        app.globalData.userInfo = cloudUser;
        app.globalData.memberLevel = cloudUser.memberLevel || 0;
      }
      return cloudUser;
    }
  } catch (e) {
    console.error('刷新用户信息失败:', e);
  }
  return null;
};

module.exports = {
  checkLoginStatus,
  checkAuth,
  isAdmin,
  login,
  register,
  loginOrRegister,
  logout,
  refreshUserInfo
};
