const { api, DB } = require('../utils/api');
const { getStorage, setStorage } = require('../utils/util');
const CONSTANTS = require('../utils/constants');

const userService = {
  async getUserByPhone(phone) {
    const users = await api.get(DB.users, { where: { phone } });
    return users[0] || null;
  },

  async getUserById(userId) {
    return await api.getById(DB.users, userId);
  },

  async updateUser(userId, data) {
    await api.update(DB.users, userId, data);
  },

  async updateMemberLevel(userId, level) {
    await this.updateUser(userId, { memberLevel: level });
  },

  async addPoints(userId, points) {
    const user = await this.getUserById(userId);
    if (user) {
      const newPoints = (user.points || 0) + points;
      await this.updateUser(userId, { points: newPoints });
      return newPoints;
    }
    return 0;
  },

  async updatePoints(userId, points) {
    await this.updateUser(userId, { points });
  },

  async incrementBookings(userId) {
    const user = await this.getUserById(userId);
    if (user) {
      const totalBookings = (user.totalBookings || 0) + 1;
      await this.updateUser(userId, { totalBookings });
      return totalBookings;
    }
    return 0;
  },

  getLocalUser() {
    return getStorage(CONSTANTS.STORAGE_KEYS.USER_INFO);
  },

  isLoggedIn() {
    const user = this.getLocalUser();
    return !!user;
  },

  getMemberLevel() {
    const user = this.getLocalUser();
    return user?.memberLevel || 0;
  },

  getDiscount() {
    const level = this.getMemberLevel();
    const discounts = [1, 0.9, 0.7];
    return discounts[level] || 1;
  }
};

module.exports = userService;
