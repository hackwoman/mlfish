// index.js
const app = getApp();
const weatherService = require('../../utils/weather');
const bookingService = require('../../services/bookingService');

Page({
  data: {
    userInfo: null,
    isCaptain: false,  // 船长/管理员标识
    
    // 天气
    weather: {
      temp: 26,
      weather: '多云',
      weatherIcon: '⛅',
      wind: '3 级',
      humidity: 75
    },
    
    // Banner - 漫画风格场景
    banners: [
      {
        id: 1,
        type: 'fishing',
        title: '海钓体验',
        subtitle: '与大海亲密接触 · 享受垂钓乐趣',
        icon: '🎣'
      },
      {
        id: 2,
        type: 'boat',
        title: '专业船长带队',
        subtitle: '资深船长指引 · 钓点精准定位',
        icon: '⚓'
      },
      {
        id: 3,
        type: 'fish',
        title: '美味海鲜',
        subtitle: '现钓现煮 · 品尝大海的鲜美',
        icon: '🐟'
      }
    ],
    currentBannerIndex: 0,
    
    // 日历
    currentYear: 2026,
    currentMonth: 3,
    days: [],
    selectedDate: '',
    
    // 活动列表
    activities: [],
    
    // 预约弹窗
    showBookingModal: false,
    bookingDate: '',
    bookingTimeSlots: ['06:00-10:00', '10:00-14:00', '14:00-18:00', '18:00-22:00'],
    selectedTimeSlot: '',
    bookingPeople: 1,
    bookingPhone: '',
    bookingName: '',
    
    // 我的预约列表
    myBookings: [],
    
    // 船长视角
    showCaptainPanel: false,
    captainDateBookings: [],
    selectedTripDate: '',
    showTripModal: false,
    tripTimeSlot: '',
    
    // 行程列表
    trips: []
  },

  onLoad() {
    // 获取当前日期
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      selectedDate: this.formatDate(now)
    });
    
    // 加载天气
    this.loadWeather();
    
    // 初始化 Banner
    this.initBanner();
    
    // 检查登录状态
    this.checkLoginStatus();
    
    // 生成日历（异步）
    this.generateCalendar();
    
    // 加载活动（异步）
    this.loadActivities();
    
    // 加载我的预约
    this.loadMyBookings();
    
    // 加载行程
    this.loadTrips();
    
    // 启动自动检测服务
    this.startAutoCheckService();
  },

  // 页面显示时重新加载活动列表
  onShow() {
    this.loadActivities();
    this.loadMyBookings();
    this.loadTrips();
  },

  // 加载天气
  async loadWeather() {
    try {
      const weatherData = await weatherService.getWeather();
      if (weatherData.success) {
        this.setData({ weather: weatherData.data });
        console.log('[天气] 加载成功:', weatherData.data);
      }
    } catch (e) {
      console.error('[天气] 加载失败:', e);
    }
  },

  // 初始化 Banner
  initBanner() {
    // 监听 swiper 切换
    const that = this;
    that.bannerChange = function(e) {
      const currentIndex = e.detail.current;
      that.setData({ currentBannerIndex: currentIndex });
    };
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const userRole = wx.getStorageSync('userRole') || 'user';
    const bookingPhone = wx.getStorageSync('bookingPhone');
    
    this.setData({ 
      userInfo: userInfo || null,
      isLoggedIn: !!userInfo,
      isCaptain: userRole === 'admin',
      bookingPhone: bookingPhone || ''
    });
  },

  getUserInfo() {
    this.checkLoginStatus();
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 生成日历（从云数据库读取预约人数）
  async generateCalendar() {
    const { currentYear, currentMonth } = this.data;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
    
    const days = [];
    
    // 补齐空白的日期
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: '', date: '' });
    }
    
    // 生成当月日期
    const today = new Date();
    
    // 从云数据库获取预约统计
    let bookingsByDate = {};
    try {
      const app = getApp();
      bookingsByDate = await bookingService.getBookingsGroupByDate();
    } catch (e) {
      console.error('获取云端预约数据失败:', e);
      // 降级使用本地存储
      bookingsByDate = wx.getStorageSync('allBookings') || {};
    }
    
    const trips = wx.getStorageSync('trips') || {};
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = currentYear === today.getFullYear() && 
                     currentMonth === today.getMonth() + 1 && 
                     i === today.getDate();
      
      // 从云端获取预约数据
      const dateBookings = bookingsByDate[date] || [];
      const hasBookings = dateBookings.length > 0;
      const bookingCount = dateBookings.reduce((sum, b) => sum + (b.people || 1), 0);
      
      // 检查是否有行程
      const hasTrip = trips[date] && trips[date].status === 'ongoing';
      
      // 模拟有活动的日期
      const activityDates = ['2026-03-04', '2026-03-11', '2026-03-15', '2026-03-21', '2026-03-28'];
      const hasActivity = activityDates.includes(date);
      
      const isFull = bookingCount >= 10;
      days.push({
        day: i,
        date,
        isToday,
        hasActivity,
        hasBookings,
        bookingCount,
        hasTrip,
        isFull
      });
    }
    
    this.setData({ days });
  },

  // 加载活动列表（满4人的日期）- 从云数据库读取
  async loadActivities() {
    // 从云数据库获取预约统计
    let bookingsByDate = {};
    try {
      const app = getApp();
      bookingsByDate = await bookingService.getBookingsGroupByDate();
    } catch (e) {
      console.error('获取云端预约数据失败:', e);
      // 降级使用本地存储
      bookingsByDate = wx.getStorageSync('allBookings') || {};
    }
    
    const trips = wx.getStorageSync('trips') || {};
    
    const activities = [];
    
    // 遍历所有有预约的日期
    for (const date in bookingsByDate) {
      const bookings = bookingsByDate[date];
      const totalPeople = bookings.reduce((sum, b) => sum + (b.people || 1), 0);
      
      // 只显示满4人的
      if (totalPeople >= 4) {
        const trip = trips[date];
        const activity = trip?.activity || null;
        
        // 格式化日期为 "3月15日" 格式
        const dateParts = date.split('-');
        const month = parseInt(dateParts[1]);
        const day = parseInt(dateParts[2]);
        const displayDate = `${month}月${day}日`;
        
        activities.push({
          id: date.replace(/-/g, ''),
          title: activity?.title || '待定活动',
           description: activity?.description || '暂无活动安排',
          date: date,
          displayDate: displayDate,
          icon: '🚤',
          coverColor: this.getRandomColor(),
          current: totalPeople,
          max: activity?.maxPeople === 6 ? 10 : (activity?.maxPeople || 10),
          price: activity?.price || 599,
          status: trip?.status === 'ongoing' ? 'ongoing' : 'open',
          statusClass: trip?.status === 'ongoing' ? 'tag-info' : 'tag-success',
          statusText: trip?.status === 'ongoing' ? '进行中' : '报名中',
          hasActivity: !!activity
        });
      }
    }
    
    // 按日期排序
    activities.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    this.setData({ activities });
  },

  // 获取随机颜色
  getRandomColor() {
    const colors = ['#667eea', '#11998e', '#ee0979', '#f5a623', '#159895', '#e74c3c'];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // 上个月
  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 1) {
      currentMonth = 12;
      currentYear--;
    } else {
      currentMonth--;
    }
    this.setData({ currentYear, currentMonth });
    this.generateCalendar();
  },

  // 下个月
  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 12) {
      currentMonth = 1;
      currentYear++;
    } else {
      currentMonth++;
    }
    this.setData({ currentYear, currentMonth });
    this.generateCalendar();
  },

  // 选择日期 - 打开预约弹窗 或 船长面板
  selectDay(e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;
    
    const today = new Date();
    const selected = new Date(date.replace(/-/g, '/'));
    
    // 船长视角已禁用，所有用户均可预约
    
    // 不能预约今天之前的日子
    if (selected < today.setHours(0,0,0,0)) {
      wx.showToast({
        title: '不能预约过去的日子',
        icon: 'none'
      });
      return;
    }
    
    // 检查日期是否满员
    const dayInfo = this.data.days.find(d => d.date === date);
    if (dayInfo && dayInfo.isFull) {
      wx.showToast({
        title: '该日期已满员，无法预约',
        icon: 'none'
      });
      return;
    }
    
    // 计算剩余名额
    const MAX_PEOPLE = 10;
    const bookingCount = dayInfo?.bookingCount || 0;
    const remainingSlots = MAX_PEOPLE - bookingCount;
    
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    const bookingPhone = userInfo?.phone || '';
    const bookingName = userInfo?.nickName || userInfo?.name || '游客';
    
    this.setData({ 
      selectedDate: date,
      bookingDate: date,
      showBookingModal: true,
      selectedTimeSlot: '',
      bookingPeople: 1,
      bookingPhone: bookingPhone,
      bookingName: bookingName,
      remainingSlots: remainingSlots,
      bookedCount: bookingCount
    });
  },

  // 船长面板 - 查看某日预约（从云数据库读取）
  async showCaptainPanel(date) {
    // 从云数据库获取预约数据
    let dateBookings = [];
    let totalPeople = 0;
    try {
      const app = getApp();
      const bookingsByDate = await bookingService.getBookingsGroupByDate();
      dateBookings = bookingsByDate[date] || [];
      totalPeople = dateBookings.reduce((sum, b) => sum + (b.people || 1), 0);
    } catch (e) {
      console.error('获取云端预约数据失败:', e);
      // 降级使用本地存储
      const allBookings = wx.getStorageSync('allBookings') || {};
      dateBookings = allBookings[date] || [];
      totalPeople = dateBookings.reduce((sum, b) => sum + b.people, 0);
    }
    
    const trips = wx.getStorageSync('trips') || {};
    const trip = trips[date];
    
    this.setData({
      showCaptainPanel: true,
      selectedTripDate: date,
      captainDateBookings: dateBookings,
      currentTrip: trip,
      totalPeople: totalPeople
    });
  },

  // 关闭船长面板
  closeCaptainPanel() {
    this.setData({ showCaptainPanel: false });
  },

  // 发起行程（船长操作）
  openTripModal() {
    this.setData({
      showTripModal: true,
      tripTimeSlot: this.data.captainDateBookings[0]?.timeSlot || '06:00-10:00'
    });
  },

  // 关闭行程弹窗
  closeTripModal() {
    this.setData({ showTripModal: false });
  },

  // 选择行程时间段
  selectTripTimeSlot(e) {
    this.setData({ tripTimeSlot: e.currentTarget.dataset.slot });
  },

  // 确认发起行程
  confirmStartTrip() {
    const { selectedTripDate, tripTimeSlot, captainDateBookings } = this.data;
    const totalPeople = captainDateBookings.reduce((sum, b) => sum + b.people, 0);
    
    // 保存行程
    const trips = wx.getStorageSync('trips') || {};
    trips[selectedTripDate] = {
      id: Date.now(),
      date: selectedTripDate,
      timeSlot: tripTimeSlot,
      totalPeople: totalPeople,
      bookings: captainDateBookings,
      status: 'ongoing',
      createTime: new Date().toISOString()
    };
    
    wx.setStorageSync('trips', trips);
    
    wx.showToast({
      title: '行程已发起！',
      icon: 'success'
    });
    
    this.setData({ showTripModal: false, showCaptainPanel: false });
    this.generateCalendar();
    this.loadTrips();
  },

  // 结束行程
  endTrip(e) {
    const date = e.currentTarget.dataset.date;
    
    wx.showModal({
      title: '确认结束',
      content: '确定要结束该行程吗？',
      success: res => {
        if (res.confirm) {
          const trips = wx.getStorageSync('trips') || {};
          if (trips[date]) {
            trips[date].status = 'completed';
            trips[date].endTime = new Date().toISOString();
            wx.setStorageSync('trips', trips);
            
            wx.showToast({ title: '行程已结束', icon: 'success' });
            this.generateCalendar();
            this.loadTrips();
          }
        }
      }
    });
  },

  // 关闭预约弹窗
  closeBookingModal() {
    this.setData({ showBookingModal: false });
  },

  // 选择时间段
  selectTimeSlot(e) {
    const slot = e.currentTarget.dataset.slot;
    this.setData({ selectedTimeSlot: slot });
  },

  // 选择人数
  changePeople(e) {
    const type = e.currentTarget.dataset.type;
    let count = this.data.bookingPeople;
    if (type === 'add' && count < 10) {
      count++;
    } else if (type === 'minus' && count > 1) {
      count--;
    }
    this.setData({ bookingPeople: count });
  },
  
  // 减少人数
  decreasePeople() {
    let count = this.data.bookingPeople;
    if (count > 1) {
      count--;
      this.setData({ bookingPeople: count });
    }
  },
  
  // 增加人数
  increasePeople() {
    let count = this.data.bookingPeople;
    const remaining = this.data.remainingSlots || 0;
    if (count < remaining) {
      count++;
      this.setData({ bookingPeople: count });
    } else {
      wx.showToast({
        title: `最多只能预约 ${remaining} 人`,
        icon: 'none'
      });
    }
  },
  
  // 输入姓名
  inputName(e) {
    this.setData({ bookingName: e.detail.value });
  },
  
  // 输入手机号
  inputPhone(e) {
    this.setData({ bookingPhone: e.detail.value });
  },

  // 提交预约（云数据库版）
  async submitBooking() {
    const { bookingDate, bookingPeople, bookingPhone, bookingName } = this.data;
    const userInfo = wx.getStorageSync('userInfo');
    
    // 获取手机号：优先使用输入框的手机号，其次使用登录用户的手机号
    let phone = bookingPhone || userInfo?.phone || '';
    
    // 验证手机号
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      // 可以聚焦到手机号输入框，这里简单提示
      return;
    }
    
    // 简单手机号格式验证
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    
    // 检查预约人数是否超过剩余名额
    const remaining = this.data.remainingSlots || 0;
    if (bookingPeople > remaining) {
      wx.showToast({ title: `预约人数超过剩余名额（${remaining}人）`, icon: 'none' });
      return;
    }
    
    // 获取用户名：已登录用户使用昵称，未登录用户使用“游客”
    let userName = bookingName || userInfo?.nickName || userInfo?.name || '游客';
    
    console.log('用户预约:', { phone, name: userName });
    
    wx.showLoading({ title: '提交中...' });
    
    try {
      const app = getApp();
      
      // 创建预约到云数据库，时段默认为“全天”
      const result = await app.createBooking({
        date: bookingDate,
        timeSlot: '全天',
        people: bookingPeople,
        phone: phone,
        userName: userName,
        userId: userInfo?._id || ''
      });
      
      // 验证是否写入成功
      if (!result._id) {
        throw new Error('预约写入失败');
      }
      
      wx.hideLoading();
      
      wx.showToast({
        title: '预约成功！',
        icon: 'success'
      });
      
      this.setData({ showBookingModal: false });
      this.generateCalendar();
      this.loadMyBookings();
      
      this.loadActivities();  // 刷新活动列表（更新预约人数）
      // 检查是否达到自动发起行程
      this.checkAndCreateTrip(bookingDate);
      
    } catch (e) {
      wx.hideLoading();
      console.error('预约失败:', e);
      wx.showToast({ title: '预约失败: ' + (e.errMsg || e.message || '请重试'), icon: 'none', duration: 3000 });
    }
  },

  // 自动检测服务
  startAutoCheckService() {
    // 立即检查一次
    this.autoCheckAllDates();
    
    // 每隔5分钟检查一次
    setInterval(() => {
      this.autoCheckAllDates();
    }, 5 * 60 * 1000);
  },

  // 检查所有日期（从云数据库读取）
  async autoCheckAllDates() {
    // 从云数据库获取预约统计
    let bookingsByDate = {};
    try {
      const app = getApp();
      bookingsByDate = await bookingService.getBookingsGroupByDate();
    } catch (e) {
      console.error('获取云端预约数据失败:', e);
      bookingsByDate = wx.getStorageSync('allBookings') || {};
    }
    
    const trips = wx.getStorageSync('trips') || {};
    const MIN_PEOPLE = 4; // 最低成行人数
    
    for (const date in bookingsByDate) {
      // 跳过已结束的日期
      const dateObj = new Date(date.replace(/-/g, '/'));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateObj < today) continue;
      
      // 跳过已有行程的日期
      if (trips[date] && (trips[date].status === 'ongoing' || trips[date].status === 'completed')) {
        continue;
      }
      
      // 计算总人数
      const bookings = bookingsByDate[date];
      const totalPeople = bookings.reduce((sum, b) => sum + (b.people || 1), 0);
      
      // 达到下限，自动发起行程
      if (totalPeople >= MIN_PEOPLE) {
        trips[date] = {
          id: Date.now() + Math.random(),
          date: date,
          totalPeople: totalPeople,
          bookings: bookings,
          status: 'ongoing',
          autoCreated: true, // 标记为自动创建
          createTime: new Date().toISOString()
        };
        
        wx.setStorageSync('trips', trips);
        
        // 发送通知（模拟）
        console.log(`自动发起行程: ${date}, 人数: ${totalPeople}`);
      }
    }
    
    this.generateCalendar();
    this.loadTrips();
  },

  // 检查并创建行程（单个日期）- 从云数据库读取
  async checkAndCreateTrip(date) {
    // 从云数据库获取预约数据
    let bookingsByDate = {};
    try {
      const app = getApp();
      bookingsByDate = await bookingService.getBookingsGroupByDate();
    } catch (e) {
      console.error('获取云端预约数据失败:', e);
      bookingsByDate = wx.getStorageSync('allBookings') || {};
    }
    
    const trips = wx.getStorageSync('trips') || {};
    const MIN_PEOPLE = 4;
    
    // 跳过已有行程的日期
    if (trips[date] && trips[date].status === 'ongoing') return;
    
    const bookings = bookingsByDate[date] || [];
    const totalPeople = bookings.reduce((sum, b) => sum + (b.people || 1), 0);
    
    if (totalPeople >= MIN_PEOPLE) {
      // 自动发起行程
      trips[date] = {
        id: Date.now(),
        date: date,
        totalPeople: totalPeople,
        bookings: bookings,
        status: 'ongoing',
        autoCreated: true,
        createTime: new Date().toISOString()
      };
      
      wx.setStorageSync('trips', trips);
      
      wx.showModal({
        title: '🎉 行程已自动发起！',
        content: `日期：${date}\n人数：${totalPeople}人\n\n已为您自动创建行程！`,
        showCancel: false
      });
      
      this.generateCalendar();
      this.loadTrips();
    }
  },

  // 加载我的预约（云数据库版）
  async loadMyBookings() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      this.setData({ myBookings: [] });
      return;
    }
    
    try {
      const app = getApp();
      const bookings = await bookingService.getBookingsByPhone(userInfo.phone);
      
      // 过滤出当前用户的预约
      const myBookings = bookings.filter(b => b.status !== 'canceled');
      
      // 添加 id 字段（兼容 WXML 中的 item.id）
      const formattedBookings = myBookings.map(b => ({
        ...b,
        id: b._id
      }));
      
      // 按日期排序
      formattedBookings.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.setData({ myBookings: formattedBookings });
    } catch (e) {
      console.error('加载预约失败:', e);
    }
  },


  // 加载行程
  loadTrips() {
    const trips = wx.getStorageSync('trips') || {};
    const tripList = [];
    
    for (const date in trips) {
      const trip = trips[date];
      tripList.push(trip);
    }
    
    // 按日期排序
    tripList.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.setData({ trips: tripList });
  },

  // 取消预约（云数据库版）
  async cancelBooking(e) {
    const { date, id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消该预约吗？',
      success: async res => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...' });
          
          try {
            const app = getApp();
            await app.cancelBooking(id);
            
            wx.hideLoading();
            wx.showToast({ title: '已取消', icon: 'success' });
            this.generateCalendar();
            this.loadMyBookings();
          } catch (e) {
            wx.hideLoading();
            console.error('取消失败:', e);
            wx.showToast({ title: '取消失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 跳转活动详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    const date = e.currentTarget.dataset.date;
    
    // 传递日期参数给详情页
    wx.navigateTo({
      url: `/packages/detail/index?id=${id}&date=${date}`
    });
  },

  // 跳转活动列表
  goToActivityList() {
    console.log('跳转到活动列表');
    wx.switchTab({
      url: '/pages/activity/list'
    });
  },

  // 跳转个人中心
  goToProfile() {
    wx.navigateTo({
      url: '/pages/profile/index'
    });
  },

  // 跳转管理后台
  goToAdmin() {
    wx.navigateTo({
      url: '/packages/admin/index'
    });
  },

  // 显示二维码（邀请好友）
  showQRCode() {
    wx.showModal({
      title: '邀请好友',
      content: '小程序码生成中...\n\n分享给朋友让他们一起海钓吧！',
      showCancel: false
    });
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系船长',
      content: '📞 电话：138-0000-0000\n💬 微信：haidiao888\n\n添加时请备注"海钓"',
      showCancel: false
    });
  }
});
