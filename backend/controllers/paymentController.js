const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const isStaff = (u) => ['admin', 'staff'].includes(u.role);

const luhn = (num) => {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
};

/*
 * POST /api/payments
 * SIMULATED payment gateway - replace the block marked "GATEWAY" with Stripe /
 * Razorpay in production. Test cards:
 *   4242 4242 4242 4242  -> success
 *   4000 0000 0000 0002  -> declined
 * Full card numbers are validated in memory and never stored.
 */
exports.makePayment = asyncHandler(async (req, res) => {
  const { bookingId, method, cardNumber, upiId } = req.body;
  if (!bookingId || !method) throw new AppError('bookingId and method are required.');
  if (!['card', 'upi', 'cash'].includes(method)) throw new AppError('Invalid payment method.');

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found.', 404);
  if (!isStaff(req.user) && String(booking.user) !== String(req.user._id))
    throw new AppError('You do not have access to this booking.', 403);
  if (booking.status === 'cancelled') throw new AppError('This booking has been cancelled.', 409);
  if (booking.paymentStatus === 'paid') throw new AppError('This booking is already paid.', 409);
  if (method === 'cash' && !isStaff(req.user))
    throw new AppError('Cash payments can only be recorded by staff.', 403);

  const record = {
    booking: booking._id,
    user: booking.user,
    amount: booking.totalAmount,
    method,
    transactionId: 'TXN' + crypto.randomBytes(6).toString('hex').toUpperCase(),
  };

  // ---------- GATEWAY (simulated) ----------
  let declineReason = null;
  if (method === 'card') {
    const digits = String(cardNumber || '').replace(/\s|-/g, '');
    if (!/^\d{13,19}$/.test(digits) || !luhn(digits)) throw new AppError('Invalid card number.');
    record.cardLast4 = digits.slice(-4);
    if (digits.endsWith('0002')) declineReason = 'Card declined by issuer.';
  } else if (method === 'upi') {
    if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(String(upiId || '')))
      throw new AppError('Invalid UPI ID (e.g. name@bank).');
    record.upiId = upiId;
  }
  // -----------------------------------------

  if (declineReason) {
    await Payment.create({ ...record, status: 'failed', failureReason: declineReason });
    throw new AppError(declineReason, 402);
  }

  const payment = await Payment.create({ ...record, status: 'success' });
  booking.paymentStatus = 'paid';
  if (booking.status === 'pending') booking.status = 'confirmed';
  await booking.save();

  res.status(201).json({ payment, booking });
});

// GET /api/payments/my
exports.getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate({ path: 'booking', populate: { path: 'room', select: 'number type' } })
    .sort('-createdAt');
  res.json({ count: payments.length, payments });
});

// GET /api/payments  (staff)
exports.getAllPayments = asyncHandler(async (_req, res) => {
  const payments = await Payment.find()
    .populate('user', 'name email')
    .populate({ path: 'booking', populate: { path: 'room', select: 'number type' } })
    .sort('-createdAt');
  const total = payments.filter((p) => p.status === 'success').reduce((s, p) => s + p.amount, 0);
  res.json({ count: payments.length, total, payments });
});
