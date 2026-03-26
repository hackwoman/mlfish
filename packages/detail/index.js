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
      let activityData = trip?.activity || null;
      
      // 如果没有活动数据，尝试从活动模板获取
      if (!activityData) {
        const templates = wx.getStorageSync('activityTemplates') || [];
        if (templates.length > 0) {
          // 使用第一个模板作为默认活动
          activityData = { ...templates[0] };
        }
      }
      
      // 从云数据库获取活动描述（如果有）
      try {
        const db = app.getDB();
        const activityDescId = 'activity_' + date;
        const descDoc = await db.collection('bookings').doc(activityDescId).get();
        if (descDoc.data && descDoc.data.description) {
          if (!activityData) {
            activityData = {};
          }
          activityData.description = descDoc.data.description;
        }
      } catch (e) {
        // 如果文档不存在，忽略
      }
      
      // 格式化日期
      const dateParts = date.split('-');
      const month = parseInt(dateParts[1]);
      const day = parseInt(dateParts[2]);
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekDay = weekDays[new Date(date.replace(/-/g, '/')).getDay()];
      const dateText = `${month}月${day}日（${weekDay}）`;
      
      // 获取基础价格
      let basePrice = 599;
      let maxPeople = 10;
      if (activityData) {
        basePrice = activityData.price || 599;
        maxPeople = activityData.maxPeople || 10;
        // 如果 maxPeople 是旧值6，强制改为10
        if (maxPeople === 6) {
          maxPeople = 10;
          activityData.maxPeople = 10; // 更新 activityData 以便保存
        }
      }
      
      // 计算会员折扣价
      const { memberLevel, discount, discountText } = this.getDiscountInfo();
      const finalPrice = Math.round(basePrice * discount);
      
      // 获取已报名成员（从云端数据），合并同一手机号的预约
      const mergedMembers = {};
      bookings.forEach((b, idx) => {
        if (b.status === 'canceled') return; // 跳过已取消的预约
        
        const phone = b.phone;
        const people = b.people || 1;
        const name = b.userName || b.name || '游客';
        const bookTime = b.createTime ? new Date(b.createTime).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN');
        
        if (mergedMembers[phone]) {
          // 同一手机号，累加人数，更新时间为最新
          mergedMembers[phone].people += people;
          if (new Date(b.createTime) > new Date(mergedMembers[phone].latestCreateTime)) {
            mergedMembers[phone].bookTime = bookTime;
            mergedMembers[phone].latestCreateTime = b.createTime;
          }
        } else {
          // 新成员
          mergedMembers[phone] = {
            id: b._id || idx,
            name: name,
            phone: phone,
            people: people,
            timeSlot: b.timeSlot,
            bookTime: bookTime,
            latestCreateTime: b.createTime,
            statusClass: 'confirmed',
            statusText: '已确认'
          };
        }
      });
      
      // 转换为数组
      const members = Object.values(mergedMembers);
      
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
           description: activityData?.description || '暂无活动安排',
          dateText: dateText,
          time: activityData?.time || '全天',
          current: totalPeople,
          max: maxPeople,
          remaining: maxPeople - totalPeople,
          isFull: totalPeople >= maxPeople,
          basePrice: basePrice,
          price: finalPrice,
          coverColor: coverColor,
          members: members,
          status: trip?.status === 'ongoing' ? 'ongoing' : 'open',
          statusClass: trip?.status === 'ongoing' ? 'tag-info' : (totalPeople >= 4 ? 'tag-success' : 'tag-warning'),
          statusText: trip?.status === 'ongoing' ? '进行中' : (totalPeople >= 4 ? '已成行' : '报名中'),
          // 新增字段：鱼种、钓法、钓点信息
          fishSpeciesArray: activityData?.fishSpecies ? activityData.fishSpecies.split(',').map(s => s.trim()) : ['石斑鱼', '鲷鱼', '金枪鱼', '马鲛鱼'],
          fishingTips: activityData?.fishingMethods || '建议使用活饵（虾、小鱼）或铁板逗钓。',
          spot: {
            name: activityData?.fishingSpot || '大鹏湾海域',
            desc: activityData?.fishingSpotDesc || '水质清澈、鱼群丰富，是深圳周边最好的海钓场所之一。',
            distance: activityData?.distance || 20
          },
          location: activityData?.location || '深圳大鹏东山码头'
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
    const activity = this.data.activity;
    
    // 检查是否已满员
    if (activity.isFull) {
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
    // 获取手机号：优先使用存储的手机号，其次使用用户手机号
    let bookingPhone = wx.getStorageSync('bookingPhone') || userInfo?.phone;
    
    // 如果没有手机号，则弹窗输入（适用于未登录用户）
    if (!bookingPhone) {
      app.hideLoading();
      const phoneResult = await new Promise((resolve) => {
        wx.showModal({
          title: '请输入手机号',
          editable: true,
          placeholderText: '请输入手机号',
          success: (res) => {
            if (res.confirm) {
              const phone = res.content?.trim();
              resolve(phone);
            } else {
              resolve(null);
            }
          }
        });
      });
      
      if (!phoneResult) {
        app.showToast('请输入手机号');
        return;
      }
      
      // 简单手机号格式验证
      if (!/^1\d{10}$/.test(phoneResult)) {
        app.showToast('手机号格式不正确');
        return;
      }
      
      bookingPhone = phoneResult;
      // 存储手机号以便下次使用
      wx.setStorageSync('bookingPhone', bookingPhone);
    }
    
    // 获取用户名：已登录用户使用昵称，未登录用户使用“游客”
    const userName = userInfo?.nickName || userInfo?.name || '游客';
    
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
    
    // 预约数据：时段默认为全天
    const bookingData = {
      activityId: activity.id,
      activityTitle: activity.title,
      activityDate: this.data.activityDate,
      dateText: activity.dateText,
      time: '全天',
      phone: bookingPhone,
      name: userName,
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

  // 编辑活动安排（仅管理员）
  // 编辑按钮 - 弹出活动模板选择或手动编辑
  async editTitle() {
    const that = this;
    
    // 从云数据库获取活动模板列表
    let templates = [];
    try {
      const db = app.getDB();
      const res = await db.collection('activityTemplates').get();
      templates = res.data.map(item => {
        return {
          ...item,
          id: item._id
        };
      });
    } catch (err) {
      console.error('从云数据库加载模板失败:', err);
      // 降级使用本地存储
      templates = wx.getStorageSync('activityTemplates') || [];
    }
    
    if (templates.length === 0) {
      // 没有模板，直接手动编辑
      that.editTitleManually();
      return;
    }
    
    // 构建选择列表：模板名称 + 手动编辑选项
    const actionList = templates.map(t => t.title || '未命名活动');
    actionList.push('手动编辑标题');
    
    wx.showActionSheet({
      itemList: actionList,
      success: (res) => {
        const tapIndex = res.tapIndex;
        if (tapIndex < templates.length) {
          // 选择了活动模板
          const template = templates[tapIndex];
          that.applyActivityTemplate(template);
        } else {
          // 手动编辑标题
          that.editTitleManually();
        }
      }
    });
  },
  
  // 手动编辑标题
  editTitleManually() {
    const that = this;
    const currentTitle = this.data.activity.title || '待定活动';
    
    // 获取历史活动标题记录
    const historyKey = 'activityTitleHistory';
    const history = wx.getStorageSync(historyKey) || [];
    
    if (history.length > 0) {
      // 有历史记录，先让用户选择
      const actionList = ['手动输入新内容', '清空当前内容', ...history];
      wx.showActionSheet({
        itemList: actionList,
        success: (res) => {
          const tapIndex = res.tapIndex;
          if (tapIndex === 0) {
            // 手动输入
            that.showEditModal(currentTitle, historyKey, history, true);
          } else if (tapIndex === 1) {
            // 清空当前内容
            that.updateActivityTitle('待定活动');
          } else {
            // 选择历史记录
            const selectedTitle = history[tapIndex - 2];
            that.updateActivityTitle(selectedTitle);
          }
        }
      });
    } else {
      // 没有历史记录，直接显示输入框
      that.showEditModal(currentTitle, historyKey, history, true);
    }
  },
  
  // 应用活动模板
  applyActivityTemplate(template) {
    const that = this;
    const date = this.data.activityDate;
    const db = app.getDB();
    
    wx.showModal({
      title: '应用活动模板',
      content: `确定应用“${template.title}”模板吗？这将覆盖当前活动信息。`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '应用中...' });
          
          try {
            // 1. 更新本地 trips 数据
            const trips = wx.getStorageSync('trips') || {};
            if (!trips[date]) {
              trips[date] = { activity: {} };
            }
            
            // 将模板信息复制到 activity
            trips[date].activity = {
              title: template.title,
              description: template.description,
              price: template.price,
              maxPeople: template.maxPeople,
              fishSpecies: template.fishSpecies,
              fishingMethods: template.fishingMethods,
              fishingSpot: template.fishingSpot,
              location: template.location,
              time: template.time
            };
            
            wx.setStorageSync('trips', trips);
            
            // 2. 更新云数据库 trips 集合
            try {
              // 检查是否已存在该日期的trip记录
              const tripDoc = await db.collection('trips').where({ date: date }).get();
              if (tripDoc.data.length > 0) {
                // 更新现有记录
                await db.collection('trips').doc(tripDoc.data[0]._id).update({
                  data: {
                    activity: trips[date].activity,
                    updateTime: new Date().toISOString()
                  }
                });
                console.log('云数据库trips记录已更新');
              } else {
                // 新增记录
                await db.collection('trips').add({
                  data: {
                    date: date,
                    activity: trips[date].activity,
                    status: 'pending',
                    createTime: new Date().toISOString()
                  }
                });
                console.log('云数据库trips记录已创建');
              }
            } catch (cloudErr) {
              console.error('更新云数据库trips失败:', cloudErr);
              // 降级使用本地存储，不中断流程
            }
            
            // 3. 重新加载活动显示
            that.loadActivity(that.data.activity.id, date);
            
            wx.hideLoading();
            wx.showToast({ title: '模板已应用', icon: 'success' });
          } catch (err) {
            wx.hideLoading();
            console.error('应用模板失败:', err);
            wx.showToast({ title: '应用失败', icon: 'none' });
          }
        }
      }
    });
  },
  
  // 显示编辑模态框
  showEditModal(currentValue, historyKey, history, isTitle = false) {
    const that = this;
    const title = isTitle ? '编辑活动标题' : '编辑活动安排';
    const placeholder = isTitle ? '请输入活动标题' : '请输入活动安排';
    const defaultValue = isTitle ? (currentValue === '待定活动' ? '' : currentValue) : (currentValue === '待定' ? '' : currentValue);
    
    wx.showModal({
      title: title,
      editable: true,
      placeholderText: placeholder,
      value: defaultValue,
      success: async (res) => {
        if (res.confirm) {
          const newValue = res.content?.trim();
          if (!newValue) {
            wx.showToast({ title: '内容不能为空', icon: 'none' });
            return;
          }
          
          // 更新当前活动
          if (isTitle) {
            that.updateActivityTitle(newValue);
          } else {
            that.updateActivityDescription(newValue);
          }
          
          // 保存到历史记录（去重）
          if (!history.includes(newValue)) {
            history.unshift(newValue); // 添加到开头
            if (history.length > 10) history.pop(); // 最多保留10条
            wx.setStorageSync(historyKey, history);
          }
        }
      }
    });
  },

  // 更新活动标题到本地存储
  async updateActivityTitle(newTitle) {
    const app = getApp();
    const date = this.data.activityDate;
    
    wx.showLoading({ title: '更新中...' });
    
    try {
      // 更新本地 trips 数据中的标题
      const trips = wx.getStorageSync('trips') || {};
      if (trips[date]) {
        if (!trips[date].activity) {
          trips[date].activity = {};
        }
        trips[date].activity.title = newTitle;
        wx.setStorageSync('trips', trips);
      }
      
      // 重新加载活动显示
      this.loadActivity(this.data.activity.id, date);
      
      wx.hideLoading();
      wx.showToast({ title: '标题更新成功', icon: 'success' });
    } catch (e) {
      wx.hideLoading();
      console.error('更新活动标题失败:', e);
      wx.showToast({ title: '更新失败', icon: 'none' });
    }
  },

  // 更新活动描述到云数据库
  async updateActivityDescription(newDesc) {
    const app = getApp();
    const db = app.getDB();
    const date = this.data.activityDate;
    
    wx.showLoading({ title: '更新中...' });
    
    try {
      // 更新云数据库中的活动描述
      const activityDescId = 'activity_' + date;
      await db.collection('bookings').doc(activityDescId).set({
        data: {
          type: 'activity_description',
          date: date,
          description: newDesc,
          updateTime: new Date().toISOString()
        }
      });
      
      // 更新本地 trips 数据（保持同步）
      const trips = wx.getStorageSync('trips') || {};
      if (trips[date]) {
        if (!trips[date].activity) {
          trips[date].activity = {};
        }
        trips[date].activity.description = newDesc;
        wx.setStorageSync('trips', trips);
      }
      
      // 重新加载活动显示
      this.loadActivity(this.data.activity.id, date);
      
      wx.hideLoading();
      wx.showToast({ title: '更新成功', icon: 'success' });
    } catch (e) {
      wx.hideLoading();
      console.error('更新活动描述失败:', e);
      wx.showToast({ title: '更新失败', icon: 'none' });
    }
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
