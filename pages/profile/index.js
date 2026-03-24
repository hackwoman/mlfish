// profile.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    memberLevel: 0,
    levelName: '',
    isAdmin: false,
    stats: {
      points: 0,
      bookings: 0,
      completed: 0
    },
    discount: 10,
    
    // 登录弹窗
    showLoginModal: false,
    loginMode: 'login',  // 'login' 或 'register'
    loginName: '',
    loginPhone: '',
    loginPassword: '',
    loginPassword2: '',
    
    // 忘记密码弹窗
    showForgotModal: false,
    forgotPhone: '',
    forgotPassword: '',
    forgotPassword2: ''
  },

  onLoad() {
    this.checkUserInfo();
    // 尝试记住密码自动登录
    this.autoLoginWithRemember();
  },

  onShow() {
    this.checkUserInfo();
  },

  // 检查用户信息
  async checkUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    const userRole = wx.getStorageSync('userRole') || 'user';
    const bookingPhone = wx.getStorageSync('bookingPhone');
    
    if (userInfo) {
      // 优先使用本地存储的信息（更快）
      const members = wx.getStorageSync('registeredMembers') || [];
      const member = members.find(m => m.phone === userInfo.phone);
      const level = member?.memberLevel || userInfo.memberLevel || 0;
      
      // 尝试从云端更新用户信息（异步）
      if (userInfo._id) {
        const app = getApp();
        try {
          const db = app.getDB();
          const result = await db.collection('users').doc(userInfo._id).get();
          if (result.data) {
            // 云端数据更新到本地
            wx.setStorageSync('userInfo', result.data);
            const cloudLevel = result.data.memberLevel || 0;
            this.setData({
              userInfo: result.data,
              memberLevel: cloudLevel,
              levelName: this.getLevelName(cloudLevel),
              isAdmin: userRole === 'admin',
              discount: this.getDiscount(cloudLevel),
              stats: {
                points: result.data.points || 0,
                bookings: result.data.totalBookings || 0,
                completed: Math.floor((result.data.totalBookings || 0) * 0.8)
              }
            });
            return;
          }
        } catch (e) {
          console.log('[profile] 云端同步用户信息失败，使用本地数据');
        }
      }
      
      // 使用本地数据
      this.setData({
        userInfo,
        memberLevel: level,
        levelName: this.getLevelName(level),
        isAdmin: userRole === 'admin',
        discount: this.getDiscount(level),
        stats: member ? {
          points: member.points || 0,
          bookings: member.totalBookings || 0,
          completed: Math.floor((member.totalBookings || 0) * 0.8)
        } : {
          points: userInfo.points || 0,
          bookings: userInfo.totalBookings || 0,
          completed: Math.floor((userInfo.totalBookings || 0) * 0.8)
        }
      });
    } else {
      this.setData({
        userInfo: null,
        memberLevel: 0,
        levelName: '',
        isAdmin: false,
        stats: { points: 0, bookings: 0, completed: 0 }
      });
    }
  },

  // 获取会员等级名称
  getLevelName(level) {
    const names = ['普通会员', '会员', '贵宾'];
    return names[level] || '普通会员';
  },

  // 获取折扣
  getDiscount(level) {
    const discounts = [10, 9, 7];
    return discounts[level] || 10;
  },

  // 记住密码 - 自动登录
  autoLoginWithRemember() {
    const rememberPassword = wx.getStorageSync('rememberPassword');
    const members = wx.getStorageSync('registeredMembers') || [];
    
    if (rememberPassword && members.length > 0) {
      for (let member of members) {
        if (member.password === rememberPassword) {
          const userInfo = {
            nickName: member.name,
            phone: member.phone,
            avatarUrl: ''
          };
          wx.setStorageSync('userInfo', userInfo);
          wx.setStorageSync('bookingPhone', member.phone); // 保存手机号
          this.checkUserInfo();
          break;
        }
      }
    }
  },

  // 点击登录/注册
  goToLogin() {
    if (!this.data.userInfo) {
      this.setData({ showLoginModal: true });
    }
  },

  // 关闭登录弹窗
  closeLoginModal() {
    this.setData({ 
      showLoginModal: false,
      loginName: '',
      loginPhone: '',
      loginPassword: '',
      loginPassword2: ''
    });
  },

  // 输入姓名
  inputName(e) {
    this.setData({ loginName: e.detail.value });
  },

  // 输入手机号
  inputPhone(e) {
    this.setData({ loginPhone: e.detail.value });
  },

  // 输入密码
  inputPassword(e) {
    this.setData({ loginPassword: e.detail.value });
  },

  // 输入确认密码
  inputPassword2(e) {
    this.setData({ loginPassword2: e.detail.value });
  },

  // 切换登录/注册模式
  switchLoginMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ loginMode: mode });
  },

  // 确认登录
  async doLogin() {
    const { loginPhone, loginPassword } = this.data;
    
    if (!loginPhone || loginPhone.length !== 11) {
      wx.showToast({ title: '请输入11位手机号', icon: 'none' });
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '登录中...' });
    
    try {
      const app = getApp();
      const result = await app.loginWithPhone(loginPhone, loginPassword, '');
      
      wx.hideLoading();
      
      if (result.success) {
        // 保存到本地存储
        console.log('[登录] result.user:', result.user);
        const userData = {
          ...result.user,
          // 确保 nickName 一定有值
          nickName: result.user.name || result.user.nickName || result.user.phone || '用户'
        };
        console.log('[登录] userData:', userData);
        wx.setStorageSync('userInfo', userData);
        // 将用户添加到 registeredMembers（避免重复）
        let members = wx.getStorageSync('registeredMembers') || [];
        const existingIndex = members.findIndex(m => m.phone === result.user.phone);
        if (existingIndex !== -1) {
          members[existingIndex] = result.user;
        } else {
          members.push(result.user);
        }
        wx.setStorageSync('registeredMembers', members);
        
        this.setData({ 
          userInfo: userData, 
          showLoginModal: false,
          memberLevel: result.user.memberLevel || 0,
          levelName: this.getLevelName(result.user.memberLevel || 0)
        });
        
        wx.showToast({ title: '登录成功！', icon: 'success' });
      } else {
        wx.showToast({ title: result.msg || '手机号或密码错误', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('登录错误:', e);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    }
  },

  // 确认注册
  async doRegister() {
    const { loginName, loginPhone, loginPassword, loginPassword2 } = this.data;
    
    if (!loginName.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!loginPhone || loginPhone.length !== 11) {
      wx.showToast({ title: '请输入11位手机号', icon: 'none' });
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' });
      return;
    }
    if (loginPassword !== loginPassword2) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '注册中...' });
    
    try {
      const app = getApp();
      const result = await app.loginWithPhone(loginPhone, loginPassword, loginName.trim());
      
      wx.hideLoading();
      
      if (result.success && result.isNew) {
        // 保存到本地存储
        console.log('[注册] result.user:', result.user);
        const userData = {
          ...result.user,
          // 确保 nickName 一定有值
          nickName: result.user.name || result.user.nickName || result.user.phone || '用户'
        };
        console.log('[注册] userData:', userData);
        wx.setStorageSync('userInfo', userData);
        // 将用户添加到 registeredMembers（避免重复）
        let members = wx.getStorageSync('registeredMembers') || [];
        const existingIndex = members.findIndex(m => m.phone === result.user.phone);
        if (existingIndex !== -1) {
          members[existingIndex] = result.user;
        } else {
          members.push(result.user);
        }
        wx.setStorageSync('registeredMembers', members);
        
        this.setData({ 
          userInfo: userData, 
          showLoginModal: false,
          memberLevel: result.user.memberLevel || 0,
          levelName: this.getLevelName(result.user.memberLevel || 0)
        });
        
        wx.showToast({ title: '注册成功！送100积分', icon: 'success' });
      } else if (result.success && !result.isNew) {
        wx.showToast({ title: '该手机号已注册，请登录', icon: 'none' });
        this.setData({ loginMode: 'login' });
      } else {
        wx.showToast({ title: result.msg || '注册失败', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('注册错误:', e);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    }
  },

  // 显示忘记密码
  showForgotPassword() {
    this.setData({
      showLoginModal: false,
      showForgotModal: true,
      forgotPhone: '',
      forgotPassword: '',
      forgotPassword2: ''
    });
  },

  // 关闭忘记密码弹窗
  closeForgotModal() {
    this.setData({ showForgotModal: false });
  },

  // 输入注册手机号
  inputForgotPhone(e) {
    this.setData({ forgotPhone: e.detail.value });
  },

  // 输入新密码
  inputForgotPassword(e) {
    this.setData({ forgotPassword: e.detail.value });
  },

  // 输入确认新密码
  inputForgotPassword2(e) {
    this.setData({ forgotPassword2: e.detail.value });
  },

  // 提交忘记密码
  submitForgotPassword() {
    const { forgotPhone, forgotPassword, forgotPassword2 } = this.data;
    
    if (!forgotPhone || forgotPhone.length !== 11) {
      wx.showToast({ title: '请输入注册的手机号', icon: 'none' });
      return;
    }
    if (!forgotPassword || forgotPassword.length < 6) {
      wx.showToast({ title: '新密码至少6位', icon: 'none' });
      return;
    }
    if (forgotPassword !== forgotPassword2) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }
    
    let members = wx.getStorageSync('registeredMembers') || [];
    let member = members.find(m => m.phone === forgotPhone);
    
    if (!member) {
      wx.showToast({ title: '该手机号未注册', icon: 'none' });
      return;
    }
    
    // 更新密码
    member.password = forgotPassword;
    wx.setStorageSync('registeredMembers', members);
    wx.setStorageSync('rememberPassword', forgotPassword);
    wx.setStorageSync('bookingPhone', forgotPhone);
    
    const userInfo = {
      nickName: member.name,
      phone: member.phone,
      avatarUrl: ''
    };
    wx.setStorageSync('userInfo', userInfo);
    
    wx.showToast({ title: '密码重置成功！', icon: 'success' });
    this.setData({ 
      showForgotModal: false,
      userInfo
    });
    this.checkUserInfo();
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: res => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          // 不删除记住的密码，下次可以直接登录
          this.setData({
            userInfo: null,
            memberLevel: 0,
            levelName: '',
            isAdmin: false,
            stats: { points: 0, bookings: 0, completed: 0 }
          });
          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  },

  // 我的预约
  goToBookings() {
    if (!this.data.userInfo) {
      this.goToLogin();
      return;
    }
    wx.navigateTo({ url: '/packages/profile/bookings' });
  },

  // 会员卡
  goToMembership() {
    wx.navigateTo({ url: '/packages/profile/membership' });
  },

  // 积分商城
  goToPoints() {
    wx.navigateTo({ url: '/packages/profile/points' });
  },

  // 会员群
  goToGroup() {
    wx.showModal({
      title: '加入会员群',
      content: '添加客服微信：haidiao888，备注"海钓会员"',
      showCancel: false
    });
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '电话：138-0000-0000\n微信：haidiao888',
      showCancel: false
    });
  },

  // 管理后台
  goToAdmin() {
    wx.navigateTo({ url: '/packages/admin/index' });
  },

  // 设为管理员
  setAsAdmin() {
    wx.showModal({
      title: '设置管理员',
      content: '请输入管理员密钥',
      editable: true,
      success: res => {
        if (res.confirm && res.content === 'admin123') {
          wx.setStorageSync('userRole', 'admin');
          this.setData({ isAdmin: true });
          wx.showToast({ title: '已设为管理员', icon: 'success' });
        } else if (res.confirm) {
          wx.showToast({ title: '密钥错误', icon: 'none' });
        }
      }
    });
  },

  // 取消管理员
  removeAdmin() {
    wx.showModal({
      title: '取消管理员',
      content: '确定要取消管理员权限吗？',
      success: res => {
        if (res.confirm) {
          wx.setStorageSync('userRole', 'user');
          this.setData({ isAdmin: false });
          wx.showToast({ title: '已取消管理员', icon: 'success' });
        }
      }
    });
  }
});
