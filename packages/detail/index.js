// detail.js
const app = getApp();
const bookingService = require('../../services/bookingService');

Page({
  data: {
    hasBooked: false,
    isCaptain: false,
    isLoggedIn: false,
    memberLevel: 0,
    discount: 1,
    discountText: '标准价',
    activityDate: '',
    activity: {
      id: 1,
      title: '待定活动',
      description: '待定',
      subtitle: '',
      icon: '🚤',
      coverColor: '#667eea',
      dateText: '',
      location: '深圳大鹏东山码头',
      time: '',
      current: 0,
      max: 6,
      minPeople: 4,
      price: 599,
      status: 'open',
      statusClass: 'tag-warning',
      statusText: '报名中',
      members: [],
      spot: {
        name: '大鹏湾海域',
        desc: '水质清澈、鱼群丰富，是深圳周边最好的海钓场所之一。',
        distance: 20
      },
      fishSpecies: ['石斑鱼', '鲷鱼', '金枪鱼', '马鲛鱼'],
      fishingTips: '建议使用活饵（虾、小鱼）或铁板逗钓。',
      schedule: []
    }
  },

  onLoad(options) {
    // 检查是否是船长
    const userRole = wx.getStorageSync('userRole') || 'user';
    this.setData({ isCaptain: userRole === 'admin' });
    
    // 获取会员等级和折扣
    this.checkLoginStatus();
    
    if (options.id) {
      this.loadActivity(options.id, options.date);
    }
    
    this.checkBookingStatus();
  },

  onShow() {
    // 每次显示都检查登录状态
    this.checkLoginStatus();
    this.checkBookingStatus();
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

  // 加载活动详情（从云数据库读取）
  async loadActivity(id, date) {
    console.log('[detail] loadActivity called with id:', id, 'date:', date);
    const trips = wx.getStorageSync('trips') || {};
    
    // 如果传入了日期，从云数据库预约数据加载
    if (date) {
      // 从云数据库获取预约数据
      let bookings = [];
      let totalPeople = 0;
      try {
        const app = getApp();
        const bookingsByDate = await bookingService.getBookingsGroupByDate();
        console.log('[detail] bookingsByDate:', bookingsByDate);
        console.log('[detail] looking for date:', date);
        bookings = bookingsByDate[date] || [];
        console.log('[detail] bookings for this date:', bookings);
        totalPeople = bookings.reduce((sum, b) => sum + (b.people || 1), 0);
        console.log('[detail] totalPeople:', totalPeople);
      } catch (e) {
        console.error('获取云端预约数据失败:', e);
        // 降级使用本地存储
        const allBookings = wx.getStorageSync('allBookings') || {};
        bookings = allBookings[date] || [];
        totalPeople = bookings.reduce((sum, b) => sum + b.people, 0);
      }
      
      const trip = trips[date];
      const activityData = trip?.activity || null;
      
      // 格式化日期
      const dateParts = date.split('-');
      const month = parseInt(dateParts[1]);
      const day = parseInt(dateParts[2]);
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekDay = weekDays[new Date(date.replace(/-/g, '/')).getDay()];
      const dateText = `${month}月${day}日（${weekDay}）`;
      
      // 获取基础价格
      let basePrice = 599;
      let maxPeople = 6;
      if (activityData) {
        basePrice = activityData.price || 599;
        maxPeople = activityData.maxPeople || 6;
      }
      
      // 计算会员折扣价
      const { memberLevel, discount, discountText } = this.getDiscountInfo();
      const finalPrice = Math.round(basePrice * discount);
      
      // 获取已报名成员（从云端数据）
      const members = bookings.map((b, idx) => ({
        id: b._id || idx,
        name: b.userName || b.name || '游客',
        phone: b.phone,
        people: b.people || 1,
        timeSlot: b.timeSlot,
        bookTime: b.createTime ? new Date(b.createTime).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN'),
        statusClass: b.status === 'canceled' ? 'canceled' : 'confirmed',
        statusText: b.status === 'canceled' ? '已取消' : '已确认'
      }));
      
      const colors = ['#667eea', '#11998e', '#ee0979', '#f5a623', '#159895'];
      const coverColor = colors[Math.floor(Math.random() * colors.length)];
      
      this.setData({
        activityDate: date,
        memberLevel: memberLevel,
        discount: discount,
        discountText: discountText,
        activity: {
          ...this.data.activity,
          id: id,
          title: activityData?.title || '待定活动',
          description: activityData?.description || '待定',
          dateText: dateText,
          time: trip?.timeSlot || '待定',
          current: totalPeople,
          max: maxPeople,
          basePrice: basePrice,
          price: finalPrice,
          coverColor: coverColor,
          members: members,
          status: trip?.status === 'ongoing' ? 'ongoing' : 'open',
          statusClass: trip?.status === 'ongoing' ? 'tag-info' : (totalPeople >= 4 ? 'tag-success' : 'tag-warning'),
          statusText: trip?.status === 'ongoing' ? '进行中' : (totalPeople >= 4 ? '已成行' : '报名中')
        }
      });
    }
  },

  // 获取折扣信息
  getDiscountInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    const members = wx.getStorageSync('registeredMembers') || [];
    let memberLevel = 0;
    
    if (userInfo) {
      const member = members.find(m => m.name === userInfo.nickName);
      memberLevel = member?.memberLevel || 0;
    }
    
    const discounts = [1, 0.9, 0.7];
    const texts = ['标准价', '会员9折', '贵宾7折'];
    
    return {
      memberLevel: memberLevel,
      discount: discounts[memberLevel] || 1,
      discountText: texts[memberLevel] || '标准价'
    };
  },

  // 检查预约状态（从云数据库读取）
  async checkBookingStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const bookingPhone = wx.getStorageSync('bookingPhone');
    const date = this.data.activityDate;
    
    if (!date) return;
    
    if (userInfo || bookingPhone) {
      // 从云数据库获取预约数据
      let bookings = [];
      try {
        const app = getApp();
        const bookingsByDate = await bookingService.getBookingsGroupByDate();
        bookings = bookingsByDate[date] || [];
      } catch (e) {
        console.error('获取云端预约数据失败:', e);
        // 降级使用本地存储
        const allBookings = wx.getStorageSync('allBookings') || {};
        bookings = allBookings[date] || [];
      }
      
      const myBooking = bookings.find(b => 
        b.phone === bookingPhone || 
        b.userName === userInfo?.nickName ||
        b.userName === userInfo?.name
      );
      this.setData({ hasBooked: !!myBooking });
    }
  },

  // 联系客服
  contact() {
    wx.makePhoneCall({
      phoneNumber: '138-0000-0000'
    });
  },

  // 预约活动
  bookActivity() {
    // 检查登录
    if (!app.checkAuth()) {
      return;
    }
    
    const activity = this.data.activity;
    
    // 检查是否已满员
    if (activity.current >= activity.max) {
      app.showToast('该活动已满员');
      return;
    }
    
    // 确认预约
    wx.showModal({
      title: '确认预约',
      content: `确认预约 "${activity.title}"？\n\n📅 ${activity.dateText}\n💰 费用：¥${activity.price}\n\n成行后自动拉群，请留意群消息`,
      confirmText: '确认预约',
      success: res => {
        if (res.confirm) {
          this.processBooking();
        }
      }
    });
  },

  // 处理预约
  async processBooking() {
    app.showLoading('提交预约...');
    
    const activity = this.data.activity;
    const userInfo = wx.getStorageSync('userInfo');
    const bookingPhone = wx.getStorageSync('bookingPhone') || userInfo?.phone;
    
    if (!bookingPhone) {
      app.hideLoading();
      app.showToast('请先登录');
      return;
    }
    
    // 检查是否已预约（查询云数据库）- 只检查有效日期
    try {
      const app = getApp();
      const db = app.getDB();
      const activityDate = this.data.activityDate;
      
      // 只检查有有效日期的预约
      if (activityDate && activityDate !== '') {
        const existingBookings = await db.collection('bookings').where({
          phone: bookingPhone,
          activityDate: activityDate,
          status: db.command.neq('canceled')
        }).get();
        
        if (existingBookings.data && existingBookings.data.length > 0) {
          app.hideLoading();
          wx.showModal({
            title: '⚠️ 已预约',
            content: '您已预约过该日期的活动，请勿重复预约！',
            showCancel: false,
            confirmText: '知道了'
          });
          return;
        }
      }
    } catch (e) {
      console.log('[预约] 检查重复预约失败，继续预约:', e);
    }
    
    // 预约数据
    const bookingData = {
      activityId: activity.id,
      activityTitle: activity.title,
      activityDate: this.data.activityDate,
      dateText: activity.dateText,
      time: activity.time,
      phone: bookingPhone || userInfo?.phone,
      name: userInfo?.nickName || userInfo?.name || '用户',
      people: 1,
      price: activity.price,
      basePrice: activity.basePrice || activity.price,
      memberDiscount: this.data.discount,
      location: activity.location,
      status: 'pending',
      createTime: new Date().toISOString()
    };
    
    console.log('[预约] 开始创建预约, data:', bookingData);
    
    try {
      // 写入云数据库
      const result = await app.createBooking(bookingData);
      console.log('[预约] 云数据库写入成功:', result);
      
      // 同时保存到本地存储作为备份
      wx.setStorageSync('booking_' + activity.id, {
        _id: result._id,
        activityId: activity.id,
        bookTime: new Date().toLocaleString(),
        status: 'confirmed'
      });
      
      // 刷新云端数据以更新显示
      this.loadActivity(activity.id, this.data.activityDate);
      this.checkBookingStatus();
      
      app.hideLoading();
      
      // 判断是否成行
      const newCurrent = activity.current + 1;
      if (newCurrent >= activity.minPeople && newCurrent <= activity.max) {
        wx.showModal({
          title: '🎉 人数已达标！',
          content: '已达到最低成行人数，活动确定出发！\n\n系统将自动拉群，请留意微信群消息。',
          showCancel: false,
          success: () => {
            this.createWeChatGroup();
          }
        });
      } else {
        wx.showToast({
          title: '预约成功！',
          icon: 'success'
        });
      }
      
      // 返回上一页并刷新活动列表
      console.log('[预约成功] 准备刷新活动列表...');
      const pages = getCurrentPages();
      console.log('[预约成功] 页面栈:', pages.map(p => p.route));
      
      if (pages.length > 1) {
        const prevPage = pages[pages.length - 2];
        console.log('[预约成功] 上一页:', prevPage.route);
        if (prevPage.loadActivities) {
          console.log('[预约成功] 调用上一页 loadActivities');
          prevPage.loadActivities();
        } else {
          console.log('[预约成功] 上一页没有 loadActivities 方法');
        }
      }
      
      console.log('[预约成功] 调用 navigateBack');
      wx.navigateBack();
    } catch (e) {
      console.error('[预约] 预约失败:', e);
      app.hideLoading();
      wx.showToast({
        title: '预约失败，请重试',
        icon: 'none'
      });
    }
  },

  // 取消预约
  cancelBooking() {
    const activity = this.data.activity;
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消预约吗？取消后名额将释放给其他用户。',
      success: res => {
        if (res.confirm) {
          this.processCancel();
        }
      }
    });
  },

  // 处理取消
  processCancel() {
    app.showLoading('取消中...');
    
    const activity = this.data.activity;
    
    setTimeout(() => {
      // 清除预约状态
      wx.removeStorageSync('booking_' + activity.id);
      
      // 刷新云端数据以更新显示
      this.loadActivity(activity.id, this.data.activityDate);
      this.checkBookingStatus();
      
      app.hideLoading();
      
      wx.showToast({
        title: '已取消',
        icon: 'success'
      });
    }, 500);
  },

  // 创建微信群（模拟）
  createWeChatGroup() {
    // TODO: 调用后端接口创建群聊
    // 这里展示客服联系方式
    wx.showModal({
      title: '加入活动群',
      content: '添加客服微信：haidiao888\n备注"海钓+日期"即可入群',
      showCancel: false
    });
  },

  // 分享
  onShareAppMessage() {
    const activity = this.data.activity;
    return {
      title: `${activity.title} - 魅力海钓`,
      path: `/packages/detail/index?id=${activity.id}`
    };
  }
});
