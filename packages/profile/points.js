// points.js
const app = getApp();

Page({
  data: {
    isLoggedIn: false,
    points: 0,
    gifts: [
      { id: 1, icon: '🎣', name: '便携钓具套装', points: 500 },
      { id: 2, icon: '🧴', name: '防晒三件套', points: 300 },
      { id: 3, icon: '🧢', name: '防晒帽', points: 200 },
      { id: 4, icon: '💊', name: '晕船药套装', points: 150 },
      { id: 5, icon: '☕', name: '咖啡券', points: 100 },
      { id: 6, icon: '🎫', name: '活动优惠券', points: 50 }
    ],
    records: []
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadPoints();
  },

  onShow() {
    this.checkLoginStatus();
    this.loadPoints();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const members = wx.getStorageSync('registeredMembers') || [];
    
    if (userInfo) {
      const member = members.find(m => m.phone === userInfo.phone);
      this.setData({
        isLoggedIn: true,
        points: member?.points || 0
      });
    } else {
      this.setData({
        isLoggedIn: false,
        points: 0
      });
    }
  },

  loadPoints() {
    // 数据已在 checkLoginStatus 中加载
  },

  exchange(e) {
    const id = e.currentTarget.dataset.id;
    const gift = this.data.gifts.find(g => g.id === id);
    
    if (this.data.points < gift.points) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '确认兑换',
      content: `兑换 "${gift.name}"？\n消耗 ${gift.points} 积分`,
      success: res => {
        if (res.confirm) {
          wx.showToast({
            title: '兑换成功！',
            icon: 'success'
          });
          this.setData({
            points: this.data.points - gift.points
          });
        }
      }
    });
  }
});
