const DB = {
  users: 'users',
  bookings: 'bookings',
  trips: 'trips',
  activityTemplates: 'activityTemplates'
};

class Api {
  constructor() {
    this.db = null;
  }

  init(cloudEnv) {
    if (wx.cloud) {
      wx.cloud.init({
        env: cloudEnv,
        traceUser: true
      });
    }
    this.db = wx.cloud.database();
    return this.db;
  }

  getDB() {
    if (!this.db) {
      const app = getApp();
      return this.init(app.globalData.cloudEnv);
    }
    return this.db;
  }

  async get(collection, query = {}, options = {}) {
    const db = this.getDB();
    let q = db.collection(collection);

    if (query.where && Object.keys(query.where).length > 0) {
      q = q.where(query.where);
    }
    if (query.orderBy) {
      q = q.orderBy(query.orderBy.field, query.orderBy.order);
    }
    if (query.skip) {
      q = q.skip(query.skip);
    }
    if (query.limit) {
      q = q.limit(query.limit);
    }

    const result = await q.get();
    return result.data;
  }

  async getById(collection, id) {
    const db = this.getDB();
    const result = await db.collection(collection).doc(id).get();
    return result.data;
  }

  async add(collection, data) {
    const db = this.getDB();
    const result = await db.collection(collection).add({
      data: {
        ...data,
        createTime: new Date().toISOString()
      }
    });
    return result;
  }

  async update(collection, id, data) {
    const db = this.getDB();
    await db.collection(collection).doc(id).update({
      data
    });
  }

  async remove(collection, id) {
    const db = this.getDB();
    await db.collection(collection).doc(id).remove();
  }

  async count(collection, query = {}) {
    const db = this.getDB();
    let q = db.collection(collection);

    if (query.where && Object.keys(query.where).length > 0) {
      q = q.where(query.where);
    }

    return await q.count();
  }
}

const api = new Api();

module.exports = {
  DB,
  api
};
