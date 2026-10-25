const Room = require('../models/Room');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { bookedRoomIds } = require('../utils/availability');

const parseDate = (s) => {
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

// GET /api/rooms?type=&minPrice=&maxPrice=&guests=&checkIn=&checkOut=
// Public. Hides rooms under maintenance; filters out rooms booked for the dates.
exports.getRooms = asyncHandler(async (req, res) => {
  const { type, minPrice, maxPrice, guests, checkIn, checkOut } = req.query;
  const filter = { status: 'available' };

  if (type) filter.type = type;
  if (guests) filter.capacity = { $gte: Number(guests) };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (checkIn && checkOut) {
    const ci = parseDate(checkIn);
    const co = parseDate(checkOut);
    if (!ci || !co || co <= ci) throw new AppError('Invalid check-in / check-out dates.');
    filter._id = { $nin: await bookedRoomIds(ci, co) };
  }

  const rooms = await Room.find(filter).sort('price');
  res.json({ count: rooms.length, rooms });
});

// GET /api/rooms/manage/all  (staff) - includes maintenance rooms
exports.getAllRooms = asyncHandler(async (_req, res) => {
  const rooms = await Room.find().sort('number');
  res.json({ count: rooms.length, rooms });
});

// GET /api/rooms/:id
exports.getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) throw new AppError('Room not found.', 404);
  res.json({ room });
});

// GET /api/rooms/:id/booked-dates  - upcoming blocked ranges for the booking calendar
exports.getBookedDates = asyncHandler(async (req, res) => {
  const ranges = await Booking.find({
    room: req.params.id,
    status: { $in: ['pending', 'confirmed', 'checked-in'] },
    checkOut: { $gt: new Date() },
  }).select('checkIn checkOut -_id');
  res.json({ ranges });
});

const ROOM_FIELDS = ['number', 'type', 'floor', 'price', 'capacity', 'amenities', 'description', 'image', 'status'];
const pick = (body) =>
  ROOM_FIELDS.reduce((o, k) => (body[k] !== undefined ? { ...o, [k]: body[k] } : o), {});

// POST /api/rooms (staff)
exports.createRoom = asyncHandler(async (req, res) => {
  const data = pick(req.body);
  if (typeof data.amenities === 'string')
    data.amenities = data.amenities.split(',').map((s) => s.trim()).filter(Boolean);
  const room = await Room.create(data);
  res.status(201).json({ room });
});

// PUT /api/rooms/:id (staff)
exports.updateRoom = asyncHandler(async (req, res) => {
  const data = pick(req.body);
  if (typeof data.amenities === 'string')
    data.amenities = data.amenities.split(',').map((s) => s.trim()).filter(Boolean);
  const room = await Room.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!room) throw new AppError('Room not found.', 404);
  res.json({ room });
});

// DELETE /api/rooms/:id (admin)
exports.deleteRoom = asyncHandler(async (req, res) => {
  const active = await Booking.exists({
    room: req.params.id,
    status: { $in: ['pending', 'confirmed', 'checked-in'] },
  });
  if (active) throw new AppError('Cannot delete a room that has active bookings.', 409);
  const room = await Room.findByIdAndDelete(req.params.id);
  if (!room) throw new AppError('Room not found.', 404);
  res.json({ message: 'Room deleted.' });
});
