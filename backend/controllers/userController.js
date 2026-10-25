const User = require('../models/User');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/users?role=&search=   (staff)
exports.getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search)), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const users = await User.find(filter).sort('-createdAt');
  res.json({ count: users.length, users });
});

// GET /api/users/:id   (staff) - profile + stay history
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  const bookings = await Booking.find({ user: user._id }).populate('room', 'number type').sort('-createdAt');
  res.json({ user, bookings });
});

// POST /api/users   (admin) - create staff / admin / guest account
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password) throw new AppError('Name, email and password are required.');
  const user = await User.create({ name, email, password, phone, role: role || 'staff' });
  res.status(201).json({ user });
});

// PUT /api/users/:id/role   (admin)
exports.updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['guest', 'staff', 'admin'].includes(role)) throw new AppError('Invalid role.');
  if (String(req.params.id) === String(req.user._id))
    throw new AppError('You cannot change your own role.', 409);
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw new AppError('User not found.', 404);
  res.json({ user });
});

// DELETE /api/users/:id   (admin)
exports.deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id))
    throw new AppError('You cannot delete your own account.', 409);
  const active = await Booking.exists({
    user: req.params.id,
    status: { $in: ['pending', 'confirmed', 'checked-in'] },
  });
  if (active) throw new AppError('This user has active bookings.', 409);
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  res.json({ message: 'User deleted.' });
});
