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
      maxPeople: 6
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

  onLoad() {
    this.checkAdmin();
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

  // 加载数据
  loadData() {
    this.loadActivityTemplates();
    this.loadMembers();
    this.loadBookingLogs();
  },

  // 切换标签
  switchTab(e) {
    this.setData({ currentTab: e.currentTarget.dataset.idx });
  },

  // ========== 活动模板管理 ==========
  loadActivityTemplates() {
    const templates = wx.getStorageSync('activityTemplates') || [];
    this.setData({ activityTemplates: templates });
  },

  // 显示添加模板弹窗
  showAddTemplate() {
    this.setData({
      showTemplateModal: true,
      editingTemplate: null,
      newTemplate: { title: '', description: '', price: 599, maxPeople: 6 }
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
    
    if (!newTemplate.title) {
      wx.showToast({ title: '请输入活动名称', icon: 'none' });
      return;
    }
    
    let templates = [...activityTemplates];
    
    if (editingTemplate) {
      // 编辑
      const idx = templates.findIndex(t => t.id === editingTemplate.id);
      if (idx !== -1) {
        templates[idx] = { ...newTemplate, id: editingTemplate.id };
      }
    } else {
      // 新增
      templates.push({ ...newTemplate, id: Date.now() });
    }
    
    wx.setStorageSync('activityTemplates', templates);
    this.setData({ showTemplateModal: false, activityTemplates: templates });
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  // 删除模板
  deleteTemplate(e) {
    const idx = e.currentTarget.dataset.idx;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该活动模板吗？',
      success: res => {
        if (res.confirm) {
          let templates = this.data.activityTemplates;
          templates.splice(idx, 1);
          wx.setStorageSync('activityTemplates', templates);
          this.setData({ activityTemplates: templates });
          wx.showToast({ title: '已删除', icon: 'success' });
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
  loadMembers() {
    // 从存储获取注册会员，没有则初始化
    let members = wx.getStorageSync('registeredMembers') || [];
    
    // 如果没有会员数据，初始化一些示例
    if (members.length === 0) {
      members = [
        { id: 1, name: '张三', phone: '13800138001', memberLevel: 2, points: 1280, joinDate: '2025-06-15', totalBookings: 5 },
        { id: 2, name: '李四', phone: '13800138002', memberLevel: 1, points: 560, joinDate: '2025-08-20', totalBookings: 3 },
        { id: 3, name: '王五', phone: '13800138003', memberLevel: 0, points: 120, joinDate: '2025-12-01', totalBookings: 1 },
      ];
      wx.setStorageSync('registeredMembers', members);
    }
    
    this.setData({ members });
  },

  // 获取会员等级名称
  getMemberLevelName(level) {
    const names = ['普通', '会员', '贵宾'];
    return names[level] || '普通';
  },

  // 修改会员等级
  changeMemberLevel(e) {
    const idx = e.currentTarget.dataset.idx;
    const level = parseInt(e.detail.value);
    let members = this.data.members;
    members[idx].memberLevel = level;
    wx.setStorageSync('registeredMembers', members);
    this.setData({ members });
    wx.showToast({ title: '已修改', icon: 'success' });
  },

  // 删除会员
  deleteMember(e) {
    const idx = e.currentTarget.dataset.idx;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该会员吗？',
      success: res => {
        if (res.confirm) {
          let members = this.data.members;
          members.splice(idx, 1);
          wx.setStorageSync('registeredMembers', members);
          this.setData({ members });
          wx.showToast({ title: '已删除', icon: 'success' });
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
      let maxPeople = 6;
      
      if (activity) {
        activityTitle = activity.title || '待定';
        activityDescription = activity.description || '待定';
        price = activity.price || 599;
        maxPeople = activity.maxPeople || 6;
      } else if (templates.length > 0) {
        // 使用第一个模板的默认值
        activityTitle = templates[0].title || '待定';
        activityDescription = templates[0].description || '待定';
        price = templates[0].price || 599;
        maxPeople = templates[0].maxPeople || 6;
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
