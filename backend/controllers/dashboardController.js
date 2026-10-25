const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { expireStalePending } = require('../utils/availability');

// GET /api/dashboard/stats   (staff)
exports.getStats = asyncHandler(async (_req, res) => {
  await expireStalePending();

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrow = new Date(today.getTime() + 86400000);
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  const [
    totalRooms,
    maintenanceRooms,
    occupied,
    guests,
    arrivals,
    departures,
    revenueAgg,
    monthly,
    byStatus,
  ] = await Promise.all([
    Room.countDocuments(),
    Room.countDocuments({ status: 'maintenance' }),
    Booking.countDocuments({ status: 'checked-in' }),
    User.countDocuments({ role: 'guest' }),
    Booking.find({ checkIn: { $gte: today, $lt: tomorrow }, status: { $in: ['pending', 'confirmed'] } })
      .populate('room', 'number type')
      .populate('user', 'name'),
    Booking.find({ checkOut: { $gte: today, $lt: tomorrow }, status: 'checked-in' })
      .populate('room', 'number type')
      .populate('user', 'name'),
    Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([
      { $match: { status: 'success', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          revenue: { $sum: '$amount' },
        },
      },
    ]),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  // fill all 6 months, even those with no revenue
  const revenueByMonth = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const hit = monthly.find((x) => x._id.y === d.getUTCFullYear() && x._id.m === d.getUTCMonth() + 1);
    revenueByMonth.push({
      label: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
      revenue: hit ? hit.revenue : 0,
    });
  }

  const sellable = totalRooms - maintenanceRooms;
  res.json({
    totalRooms,
    maintenanceRooms,
    occupiedRooms: occupied,
    availableRooms: Math.max(sellable - occupied, 0),
    occupancyRate: sellable > 0 ? Math.round((occupied / sellable) * 100) : 0,
    totalGuests: guests,
    totalRevenue: revenueAgg[0]?.total || 0,
    arrivalsToday: arrivals,
    departuresToday: departures,
    revenueByMonth,
    bookingsByStatus: byStatus.reduce((o, s) => ({ ...o, [s._id]: s.count }), {}),
  });
});
