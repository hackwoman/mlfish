const CONSTANTS = {
  MEMBER_LEVELS: [
    { level: 0, name: '普通会员', discount: 1, discountText: '标准价' },
    { level: 1, name: '会员', discount: 0.9, discountText: '9折' },
    { level: 2, name: '贵宾', discount: 0.7, discountText: '7折' }
  ],

  TIME_SLOTS: [
    '06:00-10:00',
    '10:00-14:00',
    '14:00-18:00',
    '18:00-22:00'
  ],

  MIN_PEOPLE: 4,

  BOOKING_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELED: 'canceled'
  },

  TRIP_STATUS: {
    OPEN: 'open',
    ONGOING: 'ongoing',
    COMPLETED: 'completed'
  },

  STORAGE_KEYS: {
    USER_INFO: 'userInfo',
    USER_ROLE: 'userRole',
    BOOKING_PHONE: 'bookingPhone',
    TRIPS: 'trips',
    ALL_BOOKINGS: 'allBookings'
  },

  COLORS: [
    '#667eea',
    '#11998e',
    '#ee0979',
    '#f5a623',
    '#159895',
    '#e74c3c'
  ],

  SERVICE_INFO: {
    PHONE: '138-0000-0000',
    WECHAT: 'haidiao888'
  }
};

module.exports = CONSTANTS;
