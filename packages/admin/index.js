// admin.js
const app = getApp();

Page({
  data: {
    isAdmin: false,
    currentTab: 0,
    
    // 活动模板
    activityTemplates: [],
    newTemplate: {
      title: '',
      description: '',
      price: 599,
      maxPeople: 10,
      fishSpecies: '', // 鱼种，用逗号分隔
      fishingMethods: '', // 钓法
      fishingSpot: '', // 钓点信息
      location: '深圳大鹏东山码头', // 地点
      time: '全天' // 时间
    },
    showTemplateModal: false,
    editingTemplate: null,
    
    // 会员管理
    members: [],
    
    // 预约管理
    allBookings: [],
    trips: [],
    bookingLogs: []
  },

  async onLoad() {
    this.checkAdmin();
    await this.initDatabase();
    this.loadData();
  },

  onShow() {
    this.checkAdmin();
    this.loadData();
  },

  // 检查管理员权限
  checkAdmin() {
    const userRole = wx.getStorageSync('userRole') || 'user';
    this.setData({ isAdmin: userRole === 'admin' });
    
    if (!this.data.isAdmin) {
      wx.showToast({ title: '无权访问', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 初始化数据库集合
  async initDatabase() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'initDatabase',
        data: {} // 默认操作：检查并创建集合
      });
      console.log('数据库初始化结果:', result);
      return result.result;
    } catch (err) {
      console.error('数据库初始化失败:', err);
      // 降级使用本地存储，不影响后续流程
      return null;
    }
  },

  // 加载数据
  loadData() {
    this.loadActivityTemplates();
    this.loadMembers();
    this.loadBookingLogs();
  },

  // 切换标签
  switchTab(e) {
    const idx = parseInt(e.currentTarget.dataset.idx);
    console.log('switchTab idx:', idx, 'currentTab:', this.data.currentTab);
    // 允许切换到活动模板（0）和会员管理（1）
    if (idx === 0 || idx === 1) {
      this.setData({ currentTab: idx });
      // 如果切换到会员管理，重新加载会员数据
      if (idx === 1) {
        this.loadMembers();
      }
    }
  },

  // ========== 活动模板管理 ==========
  loadActivityTemplates() {
    const db = app.getDB();
    db.collection('activityTemplates').get().then(res => {
      let templates = res.data.map(item => {
        const filtered = {};
        // 只保留业务字段
        const allowedFields = ['title', 'description', 'price', 'maxPeople', 'fishSpecies', 'fishingMethods', 'fishingSpot', 'location', 'time'];
        allowedFields.forEach(field => {
          if (item[field] !== undefined) {
            filtered[field] = item[field];
          }
        });
        // 添加 id 字段（用于前端）
        filtered.id = item._id;
        return filtered;
      });
      if (templates.length === 0) {
        this.createDefaultTemplates();
      } else {
        this.setData({ activityTemplates: templates });
        // 同步到本地存储作为缓存
        wx.setStorageSync('activityTemplates', templates);
      }
    }).catch(err => {
      console.error('从云数据库加载活动模板失败:', err);
      // 降级使用本地存储
      let templates = wx.getStorageSync('activityTemplates') || [];
      if (templates.length === 0) {
        this.createDefaultTemplates();
      } else {
        // 确保本地存储的模板也有 id 字段，并过滤系统字段
        templates = templates.map(item => {
          const filtered = {};
          const allowedFields = ['title', 'description', 'price', 'maxPeople', 'fishSpecies', 'fishingMethods', 'fishingSpot', 'location', 'time'];
          allowedFields.forEach(field => {
            if (item[field] !== undefined) {
              filtered[field] = item[field];
            }
          });
          filtered.id = item.id || item._id;
          return filtered;
        });
        this.setData({ activityTemplates: templates });
      }
    });
  },

  // 创建默认模板并保存到云数据库
  createDefaultTemplates() {
    const db = app.getDB();
    const defaultTemplate = {
      title: '大鹏湾海钓体验',
      description: '专业船长带队，体验海钓乐趣，适合新手和家庭。',
      price: 599,
      maxPeople: 10,
      fishSpecies: '石斑鱼,鲷鱼,金枪鱼,马鲛鱼',
      fishingMethods: '铁板逗钓,活饵钓',
      fishingSpot: '大鹏湾海域，水质清澈，鱼群丰富',
      location: '深圳大鹏东山码头',
      time: '全天'
    };
    
    db.collection('activityTemplates').add({
      data: defaultTemplate
    }).then(res => {
      console.log('默认模板创建成功:', res);
      // 重新加载模板列表
      this.loadActivityTemplates();
    }).catch(err => {
      console.error('创建默认模板失败:', err);
      // 降级使用本地存储
      const templates = [Object.assign({ id: Date.now() }, defaultTemplate)];
      this.setData({ activityTemplates: templates });
      wx.setStorageSync('activityTemplates', templates);
    });
  },

  // 显示添加模板弹窗
  showAddTemplate() {
    this.setData({
      showTemplateModal: true,
      editingTemplate: null,
      newTemplate: { title: '', description: '', price: 599, maxPeople: 10 }
    });
  },

  // 编辑模板
  editTemplate(e) {
    const idx = e.currentTarget.dataset.idx;
    const template = this.data.activityTemplates[idx];
    this.setData({
      showTemplateModal: true,
      editingTemplate: template,
      newTemplate: { ...template }
    });
  },

  // 保存模板
  saveTemplate() {
    const { newTemplate, editingTemplate, activityTemplates } = this.data;
    
    console.log('[保存模板] editingTemplate:', editingTemplate);
    console.log('[保存模板] newTemplate:', newTemplate);
    
    if (!newTemplate.title) {
      wx.showToast({ title: '请输入活动名称', icon: 'none' });
      return;
    }
    
    // 过滤掉云数据库自动字段，只保留业务字段
    const filterFields = (data) => {
      const filtered = {};
      // 只保留业务字段
      const allowedFields = ['title', 'description', 'price', 'maxPeople', 'fishSpecies', 'fishingMethods', 'fishingSpot', 'location', 'time'];
      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          filtered[field] = data[field];
        }
      });
      // 注意：不包括 _openid, _id, id, createTime 等系统字段
      return filtered;
    };
    
    const db = app.getDB();
    
    if (editingTemplate) {
      // 编辑：更新云数据库
      const docId = editingTemplate._id || editingTemplate.id;
      if (!docId) {
        console.error('模板ID缺失:', editingTemplate);
        wx.showToast({ title: '模板ID缺失', icon: 'none' });
        return;
      }
      console.log('[保存模板] 更新模板, docId:', docId);
      const updateData = filterFields(newTemplate);
      console.log('[保存模板] 更新数据:', updateData);
      db.collection('activityTemplates').doc(docId).update({
        data: updateData
      }).then(() => {
        wx.showToast({ title: '保存成功', icon: 'success' });
        this.setData({ showTemplateModal: false });
        this.loadActivityTemplates();
      }).catch(err => {
        console.error('更新模板失败:', err);
        wx.showToast({ title: '保存失败: ' + (err.errMsg || err.message || ''), icon: 'none', duration: 3000 });
      });
    } else {
      // 新增：添加到云数据库
      console.log('[保存模板] 新增模板');
      const addData = filterFields(newTemplate);
      console.log('[保存模板] 新增数据:', addData);
      db.collection('activityTemplates').add({
        data: addData
      }).then(() => {
        wx.showToast({ title: '保存成功', icon: 'success' });
        this.setData({ showTemplateModal: false });
        this.loadActivityTemplates();
      }).catch(err => {
        console.error('添加模板失败:', err);
        wx.showToast({ title: '保存失败: ' + (err.errMsg || err.message || ''), icon: 'none', duration: 3000 });
      });
    }
  },

  // 删除模板
  deleteTemplate(e) {
    const idx = e.currentTarget.dataset.idx;
    const template = this.data.activityTemplates[idx];
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该活动模板吗？',
      success: res => {
        if (res.confirm) {
          const db = app.getDB();
          db.collection('activityTemplates').doc(template._id).remove().then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadActivityTemplates();
          }).catch(err => {
            console.error('删除模板失败:', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      }
    });
  },

  // 输入框变化
  inputTemplate(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      newTemplate: { ...this.data.newTemplate, [field]: value }
    });
  },

  // ========== 会员管理 ==========
  async loadMembers() {
    try {
      const db = app.getDB();
      // 从云数据库 users 集合读取所有用户
      const users = await db.collection('users').get();
      const members = users.data.map(user => ({
        _id: user._id,
        name: user.name || user.nickName || '用户',
        phone: user.phone,
        memberLevel: user.memberLevel || 0,
        points: user.points || 0,
        totalBookings: user.totalBookings || 0,
        joinDate: user.createTime ? new Date(user.createTime).toLocaleDateString('zh-CN') : '未知'
      }));
      
      this.setData({ members });
      // 同时更新本地存储作为缓存
      wx.setStorageSync('registeredMembers', members);
    } catch (err) {
      console.error('加载会员失败:', err);
      // 降级使用本地存储
      let members = wx.getStorageSync('registeredMembers') || [];
      this.setData({ members });
    }
  },

  // 获取会员等级名称
  getMemberLevelName(level) {
    const names = ['普通', '会员', '贵宾'];
    return names[level] || '普通';
  },

  // 修改会员等级
  async changeMemberLevel(e) {
    const idx = e.currentTarget.dataset.idx;
    const level = parseInt(e.detail.value);
    const member = this.data.members[idx];
    
    try {
      const db = app.getDB();
      // 更新云数据库
      await db.collection('users').doc(member._id).update({
        data: { memberLevel: level }
      });
      
      // 更新本地数据
      let members = this.data.members;
      members[idx].memberLevel = level;
      this.setData({ members });
      
      // 更新本地存储缓存
      wx.setStorageSync('registeredMembers', members);
      
      wx.showToast({ title: '等级已更新', icon: 'success' });
    } catch (err) {
      console.error('修改会员等级失败:', err);
      wx.showToast({ title: '修改失败', icon: 'none' });
    }
  },

  // 删除会员
  deleteMember(e) {
    const idx = e.currentTarget.dataset.idx;
    const member = this.data.members[idx];
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该会员吗？此操作不可恢复！',
      success: async res => {
        if (res.confirm) {
          try {
            const db = app.getDB();
            // 从云数据库删除
            await db.collection('users').doc(member._id).remove();
            
            // 从本地数据删除
            let members = this.data.members;
            members.splice(idx, 1);
            this.setData({ members });
            
            // 更新本地存储缓存
            wx.setStorageSync('registeredMembers', members);
            
            wx.showToast({ title: '已删除', icon: 'success' });
          } catch (err) {
            console.error('删除会员失败:', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ========== 预约/活动日志管理 ==========
  loadBookingLogs() {
    const allBookings = wx.getStorageSync('allBookings') || {};
    const trips = wx.getStorageSync('trips') || {};
    const templates = wx.getStorageSync('activityTemplates') || [];
    
    const logs = [];
    const allDates = new Set([...Object.keys(allBookings), ...Object.keys(trips)]);
    
    for (const date of allDates) {
      const bookings = allBookings[date] || [];
      const trip = trips[date];
      const activity = trip?.activity || null;
      
      // 获取该日期的活动名称
      let activityTitle = '待定';
      let activityDescription = '待定';
      let price = 599;
      let maxPeople = 10;
      
      if (activity) {
        activityTitle = activity.title || '待定';
        activityDescription = activity.description || '待定';
        price = activity.price || 599;
        maxPeople = activity.maxPeople || 10;
      } else if (templates.length > 0) {
        // 使用第一个模板的默认值
        activityTitle = templates[0].title || '待定';
        activityDescription = templates[0].description || '待定';
        price = templates[0].price || 599;
        maxPeople = templates[0].maxPeople || 10;
      }
      
      const totalPeople = bookings.reduce((sum, b) => sum + b.people, 0);
      
      // 状态判断
      let status = '预约';
      let statusClass = 'tag-warning';
      if (trip) {
        if (trip.status === 'completed') {
          status = '已完成';
          statusClass = 'tag-success';
        } else if (trip.status === 'ongoing') {
          status = '进行中';
          statusClass = 'tag-info';
        }
      }
      
      logs.push({
        id: date,
        date: date,
        activityTitle: activityTitle,
        activityDescription: activityDescription,
        price: price,
        maxPeople: maxPeople,
        currentPeople: totalPeople,
        bookings: bookings,
        status: status,
        statusClass: statusClass,
        tripId: trip?.id || null,
        autoCreated: trip?.autoCreated || false
      });
    }
    
    // 按日期倒序
    logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    this.setData({ bookingLogs: logs });
  },

  // 修改活动状态
  changeLogStatus(e) {
    const date = e.currentTarget.dataset.date;
    const status = e.currentTarget.dataset.status;
    const trips = wx.getStorageSync('trips') || {};
    
    if (!trips[date]) {
      wx.showToast({ title: '无行程记录', icon: 'none' });
      return;
    }
    
    if (status === 'completed') {
      trips[date].status = 'completed';
      trips[date].endTime = new Date().toISOString();
    } else if (status === 'ongoing') {
      trips[date].status = 'ongoing';
    }
    
    wx.setStorageSync('trips', trips);
    this.loadBookingLogs();
    wx.showToast({ title: '已更新', icon: 'success' });
  },

  // 查看预约详情
  viewBookingDetail(e) {
    const date = e.currentTarget.dataset.date;
    const log = this.data.bookingLogs.find(l => l.date === date);
    
    if (log) {
      wx.setStorageSync('currentLogDetail', log);
      wx.navigateTo({
        url: '/pages/admin/log-detail?date=' + date
      });
    }
  }
});
