const Booking = require('../models/Booking');

const HOLD_MINUTES = 30;
const ACTIVE = ['pending', 'confirmed', 'checked-in'];

// Unpaid "pending" bookings only hold a room for HOLD_MINUTES.
async function expireStalePending() {
  const cutoff = new Date(Date.now() - HOLD_MINUTES * 60 * 1000);
  await Booking.updateMany(
    { status: 'pending', paymentStatus: 'unpaid', createdAt: { $lt: cutoff } },
    { status: 'cancelled', cancelReason: 'Payment not completed in time' }
  );
}

// Room ids that have an overlapping active booking in [checkIn, checkOut).
async function bookedRoomIds(checkIn, checkOut) {
  await expireStalePending();
  return Booking.distinct('room', {
    status: { $in: ACTIVE },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });
}

async function isRoomFree(roomId, checkIn, checkOut) {
  await expireStalePending();
  const clash = await Booking.exists({
    room: roomId,
    status: { $in: ACTIVE },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });
  return !clash;
}

module.exports = { bookedRoomIds, isRoomFree, expireStalePending, HOLD_MINUTES };
