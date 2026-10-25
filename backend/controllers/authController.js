const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendToken = (user, res, status = 200) =>
  res.status(status).json({ token: signToken(user._id), user });

// POST /api/auth/register  (public - always creates a guest)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) throw new AppError('Name, email and password are required.');
  if (typeof password !== 'string' || password.length < 6)
    throw new AppError('Password must be at least 6 characters.');

  const user = await User.create({ name, email, password, phone, role: 'guest' });
  sendToken(user, res, 201);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required.');

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password)))
    throw new AppError('Invalid email or password.', 401);

  sendToken(user, res);
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/me  (update own profile / password)
exports.updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const { name, phone, address, currentPassword, newPassword } = req.body;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;

  if (newPassword) {
    if (!currentPassword || !(await user.matchPassword(currentPassword)))
      throw new AppError('Current password is incorrect.', 401);
    if (newPassword.length < 6) throw new AppError('New password must be at least 6 characters.');
    user.password = newPassword;
  }

  await user.save();
  res.json({ user });
});
