const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { isRoomFree, expireStalePending } = require('../utils/availability');

const DAY = 24 * 60 * 60 * 1000;
const isStaff = (u) => ['admin', 'staff'].includes(u.role);
const TAX_RATE = () => Number(process.env.TAX_RATE ?? 0.12);

const populate = (q) => q.populate('room').populate('user', 'name email phone');

// POST /api/bookings
exports.createBooking = asyncHandler(async (req, res) => {
  const { room: roomId, checkIn, checkOut, guests = 1, specialRequests, user: forUser } = req.body;
  if (!roomId || !checkIn || !checkOut) throw new AppError('Room, check-in and check-out are required.');

  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  if (isNaN(ci) || isNaN(co)) throw new AppError('Invalid dates.');
  if (co <= ci) throw new AppError('Check-out must be after check-in.');

  // allow "today" in any timezone (yesterday UTC) but nothing earlier
  if (ci < new Date(Date.now() - DAY - (Date.now() % DAY)))
    throw new AppError('Check-in date cannot be in the past.');

  const nights = Math.round((co - ci) / DAY);
  if (nights > 30) throw new AppError('Maximum stay is 30 nights.');

  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found.', 404);
  if (room.status !== 'available') throw new AppError('This room is not available for booking.', 409);
  if (Number(guests) > room.capacity)
    throw new AppError(`This room fits at most ${room.capacity} guests.`);

  if (!(await isRoomFree(room._id, ci, co)))
    throw new AppError('Room is already booked for the selected dates.', 409);

  const subtotal = nights * room.price;
  const tax = Math.round(subtotal * TAX_RATE() * 100) / 100;
  const owner = isStaff(req.user) && forUser ? forUser : req.user._id;

  const booking = await Booking.create({
    user: owner,
    room: room._id,
    checkIn: ci,
    checkOut: co,
    guests: Number(guests),
    nights,
    subtotal,
    tax,
    totalAmount: subtotal + tax,
    specialRequests,
  });

  res.status(201).json({ booking: await populate(Booking.findById(booking._id)) });
});

// GET /api/bookings/my
exports.getMyBookings = asyncHandler(async (req, res) => {
  await expireStalePending();
  const bookings = await populate(Booking.find({ user: req.user._id }).sort('-createdAt'));
  res.json({ count: bookings.length, bookings });
});

// GET /api/bookings?status=&search=   (staff)
exports.getAllBookings = asyncHandler(async (req, res) => {
  await expireStalePending();
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  let bookings = await populate(Booking.find(filter).sort('-createdAt'));

  if (req.query.search) {
    const s = req.query.search.toLowerCase();
    bookings = bookings.filter(
      (b) =>
        b.user?.name?.toLowerCase().includes(s) ||
        b.user?.email?.toLowerCase().includes(s) ||
        b.room?.number?.toLowerCase().includes(s) ||
        String(b._id).includes(s)
    );
  }
  res.json({ count: bookings.length, bookings });
});

// GET /api/bookings/:id
exports.getBooking = asyncHandler(async (req, res) => {
  const booking = await populate(Booking.findById(req.params.id));
  if (!booking) throw new AppError('Booking not found.', 404);
  if (!isStaff(req.user) && String(booking.user._id) !== String(req.user._id))
    throw new AppError('You do not have access to this booking.', 403);
  res.json({ booking });
});

// PUT /api/bookings/:id/cancel   (owner or staff)
exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError('Booking not found.', 404);
  if (!isStaff(req.user) && String(booking.user) !== String(req.user._id))
    throw new AppError('You do not have access to this booking.', 403);
  if (['checked-in', 'checked-out', 'cancelled'].includes(booking.status))
    throw new AppError(`A ${booking.status} booking cannot be cancelled.`, 409);

  booking.status = 'cancelled';
  booking.cancelReason = req.body.reason || (isStaff(req.user) ? 'Cancelled by staff' : 'Cancelled by guest');

  if (booking.paymentStatus === 'paid') {
    booking.paymentStatus = 'refunded';
    await Payment.updateMany({ booking: booking._id, status: 'success' }, { status: 'refunded' });
  }
  await booking.save();
  res.json({ booking: await populate(Booking.findById(booking._id)) });
});

// PUT /api/bookings/:id/status   (staff) - confirm / check-in / check-out
const TRANSITIONS = {
  pending: ['confirmed'],
  confirmed: ['checked-in'],
  'checked-in': ['checked-out'],
};
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError('Booking not found.', 404);

  if (!(TRANSITIONS[booking.status] || []).includes(status))
    throw new AppError(`Cannot change status from "${booking.status}" to "${status}".`, 409);
  if (status === 'checked-in' && booking.paymentStatus !== 'paid')
    throw new AppError('Collect payment before checking the guest in.', 409);

  booking.status = status;
  await booking.save();
  res.json({ booking: await populate(Booking.findById(booking._id)) });
});
