const { api, DB } = require('../utils/api');
const { getStorage, setStorage } = require('../utils/util');
const CONSTANTS = require('../utils/constants');

const bookingService = {
  async createBooking(bookingData) {
    const data = {
      ...bookingData,
      status: CONSTANTS.BOOKING_STATUS.PENDING
    };
    return await api.add(DB.bookings, data);
  },

  async getBookingById(bookingId) {
    return await api.getById(DB.bookings, bookingId);
  },

  async getBookingsByPhone(phone) {
    return await api.get(DB.bookings, {
      where: { phone },
      orderBy: { field: 'createTime', order: 'desc' }
    });
  },

  async getAllBookings() {
    return await api.get(DB.bookings, {
      orderBy: { field: 'createTime', order: 'desc' }
    });
  },

  async cancelBooking(bookingId) {
    await api.update(DB.bookings, bookingId, {
      status: CONSTANTS.BOOKING_STATUS.CANCELED
    });
  },

  async confirmBooking(bookingId) {
    await api.update(DB.bookings, bookingId, {
      status: CONSTANTS.BOOKING_STATUS.CONFIRMED
    });
  },

  async completeBooking(bookingId) {
    await api.update(DB.bookings, bookingId, {
      status: CONSTANTS.BOOKING_STATUS.COMPLETED
    });
  },

  async getBookingsGroupByDate() {
    const bookings = await this.getAllBookings();
    const bookingsByDate = {};

    for (const booking of bookings) {
      if (booking.status === CONSTANTS.BOOKING_STATUS.CANCELED) continue;

      let date = booking.activityDate;
      if (!date || date === '') {
        date = booking.date;
      }

      if (!date || date === '') continue;

      if (!bookingsByDate[date]) {
        bookingsByDate[date] = [];
      }
      bookingsByDate[date].push(booking);
    }

    return bookingsByDate;
  },

  async getDateBookingCount(date) {
    const bookings = await api.get(DB.bookings, {
      where: { date }
    });
    return bookings.reduce((sum, b) => sum + (b.people || 1), 0);
  },

  async getValidBookingsByDate(date) {
    const allBookings = await this.getBookingsGroupByDate();
    return allBookings[date] || [];
  },

  async shouldCreateTrip(date) {
    const bookings = await this.getValidBookingsByDate(date);
    const totalPeople = bookings.reduce((sum, b) => sum + (b.people || 1), 0);
    return totalPeople >= CONSTANTS.MIN_PEOPLE;
  }
};

module.exports = bookingService;
