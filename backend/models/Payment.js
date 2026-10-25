const mongoose = require('mongoose');

// NOTE: full card numbers are never stored - only the last 4 digits.
const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['card', 'upi', 'cash'], required: true },
    status: { type: String, enum: ['success', 'failed', 'refunded'], default: 'success' },
    transactionId: { type: String, required: true, unique: true },
    cardLast4: String,
    upiId: String,
    failureReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
