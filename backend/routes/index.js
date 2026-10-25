const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const auth = require('../controllers/authController');
const rooms = require('../controllers/roomController');
const bookings = require('../controllers/bookingController');
const payments = require('../controllers/paymentController');
const users = require('../controllers/userController');
const dashboard = require('../controllers/dashboardController');

const staff = authorize('staff', 'admin');
const admin = authorize('admin');

const router = express.Router();

// ---- auth
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', protect, auth.getMe);
router.put('/auth/me', protect, auth.updateMe);

// ---- rooms
router.get('/rooms', rooms.getRooms);
router.get('/rooms/manage/all', protect, staff, rooms.getAllRooms);
router.get('/rooms/:id', rooms.getRoom);
router.get('/rooms/:id/booked-dates', rooms.getBookedDates);
router.post('/rooms', protect, staff, rooms.createRoom);
router.put('/rooms/:id', protect, staff, rooms.updateRoom);
router.delete('/rooms/:id', protect, admin, rooms.deleteRoom);

// ---- bookings
router.post('/bookings', protect, bookings.createBooking);
router.get('/bookings/my', protect, bookings.getMyBookings);
router.get('/bookings', protect, staff, bookings.getAllBookings);
router.get('/bookings/:id', protect, bookings.getBooking);
router.put('/bookings/:id/cancel', protect, bookings.cancelBooking);
router.put('/bookings/:id/status', protect, staff, bookings.updateStatus);

// ---- payments
router.post('/payments', protect, payments.makePayment);
router.get('/payments/my', protect, payments.getMyPayments);
router.get('/payments', protect, staff, payments.getAllPayments);

// ---- users / guests
router.get('/users', protect, staff, users.getUsers);
router.post('/users', protect, admin, users.createUser);
router.get('/users/:id', protect, staff, users.getUser);
router.put('/users/:id/role', protect, admin, users.updateRole);
router.delete('/users/:id', protect, admin, users.deleteUser);

// ---- dashboard
router.get('/dashboard/stats', protect, staff, dashboard.getStats);

module.exports = router;
