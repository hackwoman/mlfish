const { api, DB } = require('../utils/api');
const { getStorage, setStorage } = require('../utils/util');
const CONSTANTS = require('../utils/constants');

const tripService = {
  getLocalTrips() {
    return getStorage(CONSTANTS.STORAGE_KEYS.TRIPS) || {};
  },

  saveLocalTrips(trips) {
    setStorage(CONSTANTS.STORAGE_KEYS.TRIPS, trips);
  },

  async getTripByDate(date) {
    const trips = this.getLocalTrips();
    return trips[date] || null;
  },

  getAllLocalTrips() {
    const trips = this.getLocalTrips();
    return Object.values(trips).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async createTrip(date, timeSlot, bookings) {
    const trips = this.getLocalTrips();
    const totalPeople = bookings.reduce((sum, b) => sum + (b.people || 1), 0);

    trips[date] = {
      id: Date.now(),
      date,
      timeSlot,
      totalPeople,
      bookings,
      status: CONSTANTS.TRIP_STATUS.ONGOING,
      createTime: new Date().toISOString()
    };

    this.saveLocalTrips(trips);
    return trips[date];
  },

  async startTrip(date, timeSlot, bookings) {
    return await this.createTrip(date, timeSlot, bookings);
  },

  endTrip(date) {
    const trips = this.getLocalTrips();
    if (trips[date]) {
      trips[date].status = CONSTANTS.TRIP_STATUS.COMPLETED;
      trips[date].endTime = new Date().toISOString();
      this.saveLocalTrips(trips);
    }
  },

  isTripOngoing(date) {
    const trips = this.getLocalTrips();
    return trips[date]?.status === CONSTANTS.TRIP_STATUS.ONGOING;
  },

  isTripCompleted(date) {
    const trips = this.getLocalTrips();
    return trips[date]?.status === CONSTANTS.TRIP_STATUS.COMPLETED;
  },

  async autoCheckAndCreateTrips() {
    const bookingService = require('./bookingService');
    const bookingsByDate = await bookingService.getBookingsGroupByDate();
    const trips = this.getLocalTrips();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const date in bookingsByDate) {
      const dateObj = new Date(date.replace(/-/g, '/'));
      if (dateObj < today) continue;

      if (trips[date] && (trips[date].status === CONSTANTS.TRIP_STATUS.ONGOING || 
          trips[date].status === CONSTANTS.TRIP_STATUS.COMPLETED)) {
        continue;
      }

      const bookings = bookingsByDate[date];
      const totalPeople = bookings.reduce((sum, b) => sum + (b.people || 1), 0);

      if (totalPeople >= CONSTANTS.MIN_PEOPLE) {
        const defaultTimeSlot = bookings[0]?.timeSlot || CONSTANTS.TIME_SLOTS[0];
        await this.createTrip(date, defaultTimeSlot, bookings);
      }
    }
  }
};

module.exports = tripService;
