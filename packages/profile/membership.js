// membership.js
const app = getApp();

Page({
  data: {
    isLoggedIn: false,
    level: 0,
    levelName: '普通会员',
    memberId: '',
    expiryDate: '',
    discount: 10
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadMemberInfo();
  },

  onShow() {
    this.checkLoginStatus();
    this.loadMemberInfo();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const members = wx.getStorageSync('registeredMembers') || [];
    
    if (userInfo) {
      const member = members.find(m => m.phone === userInfo.phone);
      if (member) {
        const levelNames = ['普通会员', '会员', '贵宾'];
        const discounts = [10, 9, 7];
        this.setData({
          isLoggedIn: true,
          level: member.memberLevel || 0,
          levelName: levelNames[member.memberLevel || 0] || '普通会员',
          discount: discounts[member.memberLevel || 0] || 10,
          memberId: 'MLHD' + member.id,
          expiryDate: new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('zh-CN')
        });
      }
    } else {
      this.setData({
        isLoggedIn: false,
        level: 0,
        levelName: '普通会员',
        discount: 10
      });
    }
  },

  loadMemberInfo() {
    // 数据已在 checkLoginStatus 中加载
  },

  upgrade(e) {
    const level = e.currentTarget.dataset.level;
    const prices = { 1: 99, 2: 299, 3: 699 };
    const names = { 1: '银卡会员', 2: '金卡会员', 3: '黑卡会员' };
    
    wx.showModal({
      title: '升级会员',
      content: `确认升级为 ${names[level]}？\n费用：¥${prices[level]}/年`,
      success: res => {
        if (res.confirm) {
          // TODO: 调用支付
          wx.showToast({
            title: '升级成功！',
            icon: 'success'
          });
          this.loadMemberInfo();
        }
      }
    });
  }
});
