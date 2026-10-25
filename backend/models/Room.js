const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    number: { type: String, required: [true, 'Room number is required'], unique: true, trim: true },
    type: { type: String, enum: ['Single', 'Double', 'Deluxe', 'Suite'], required: true },
    floor: { type: Number, default: 1, min: 0 },
    price: { type: Number, required: [true, 'Price per night is required'], min: 0 },
    capacity: { type: Number, required: true, min: 1, max: 10, default: 2 },
    amenities: [{ type: String, trim: true }],
    description: { type: String, trim: true, maxlength: 1000 },
    image: { type: String, trim: true },
    // 'maintenance' rooms are hidden from guests and cannot be booked
    status: { type: String, enum: ['available', 'maintenance'], default: 'available' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
