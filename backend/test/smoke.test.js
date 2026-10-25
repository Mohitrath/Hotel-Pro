/*
 * End-to-end API smoke test (~40 checks: auth, RBAC, booking rules, payments, refunds, dashboard).
 *
 * Option A - uses a throw-away DB on your local MongoDB (it is dropped afterwards):
 *     TEST_MONGO_URI=mongodb://127.0.0.1:27017/hotelpro_test node test/smoke.test.js
 * Option B - no local MongoDB: npm i --no-save mongodb-memory-server && node test/smoke.test.js
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.TAX_RATE = '0.12';

const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');

(async () => {
  let mongod = null;
  let uri = process.env.TEST_MONGO_URI;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  await require('../config/db')(uri);
  await mongoose.connection.dropDatabase();
  const app = require('../app');
  const User = require('../models/User');
  const Room = require('../models/Room');

  const server = http.createServer(app).listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;

  const call = async (method, path, body, token) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json() };
  };
  const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  let passed = 0;
  const ok = (name, cond) => { assert.ok(cond, name); console.log('  ✓', name); passed++; };

  await User.create({ name: 'Admin', email: 'admin@t.com', password: 'secret1', role: 'admin' });
  await User.create({ name: 'Staff', email: 'staff@t.com', password: 'secret1', role: 'staff' });
  const room = await Room.create({ number: '101', type: 'Double', price: 1000, capacity: 2 });
  const room2 = await Room.create({ number: '102', type: 'Single', price: 500, capacity: 1, status: 'maintenance' });

  // ---- auth
  let r = await call('POST', '/auth/register', { name: 'Guest', email: 'g@t.com', password: 'secret1', role: 'admin' });
  ok('register works and forces role=guest', r.status === 201 && r.data.user.role === 'guest' && !r.data.user.password);
  const guest = r.data.token;
  r = await call('POST', '/auth/register', { name: 'Dup', email: 'g@t.com', password: 'secret1' });
  ok('duplicate email rejected (409)', r.status === 409);
  r = await call('POST', '/auth/login', { email: 'g@t.com', password: 'wrong' });
  ok('wrong password rejected (401)', r.status === 401);
  r = await call('POST', '/auth/login', { email: { $gt: '' }, password: { $gt: '' } });
  ok('NoSQL injection login blocked', r.status === 400 || r.status === 401);
  const admin = (await call('POST', '/auth/login', { email: 'admin@t.com', password: 'secret1' })).data.token;
  const staff = (await call('POST', '/auth/login', { email: 'staff@t.com', password: 'secret1' })).data.token;
  r = await call('GET', '/auth/me');
  ok('protected route without token -> 401', r.status === 401);

  // ---- RBAC
  r = await call('GET', '/users', null, guest);
  ok('guest cannot list users (403)', r.status === 403);
  r = await call('POST', '/rooms', { number: '9', type: 'Single', price: 1 }, guest);
  ok('guest cannot create room (403)', r.status === 403);
  r = await call('DELETE', `/rooms/${room._id}`, null, staff);
  ok('staff cannot delete room (403)', r.status === 403);

  // ---- rooms
  r = await call('GET', '/rooms');
  ok('public room list hides maintenance rooms', r.data.count === 1);
  r = await call('POST', '/rooms', { number: '201', type: 'Suite', price: 5000, capacity: 4, amenities: 'WiFi, AC' }, staff);
  ok('staff can create room; amenities parsed', r.status === 201 && r.data.room.amenities.length === 2);

  // ---- booking
  r = await call('POST', '/bookings', { room: room._id, checkIn: day(5), checkOut: day(5) }, guest);
  ok('checkout must be after checkin', r.status === 400);
  r = await call('POST', '/bookings', { room: room._id, checkIn: day(-10), checkOut: day(-8) }, guest);
  ok('past dates rejected', r.status === 400);
  r = await call('POST', '/bookings', { room: room._id, checkIn: day(5), checkOut: day(7), guests: 5 }, guest);
  ok('over-capacity rejected', r.status === 400);
  r = await call('POST', '/bookings', { room: room2._id, checkIn: day(5), checkOut: day(7) }, guest);
  ok('maintenance room cannot be booked', r.status === 409);
  r = await call('POST', '/bookings', { room: room._id, checkIn: day(5), checkOut: day(7), guests: 2 }, guest);
  ok('booking created: 2 nights, tax 12%, total 2240',
    r.status === 201 && r.data.booking.nights === 2 && r.data.booking.totalAmount === 2240 && r.data.booking.status === 'pending');
  const bid = r.data.booking._id;
  r = await call('POST', '/bookings', { room: room._id, checkIn: day(6), checkOut: day(8) }, admin);
  ok('overlapping booking rejected (409)', r.status === 409);
  r = await call('POST', '/bookings', { room: room._id, checkIn: day(7), checkOut: day(9) }, admin);
  ok('back-to-back booking (checkout day = checkin day) allowed', r.status === 201);
  r = await call('GET', `/rooms?checkIn=${day(5)}&checkOut=${day(6)}`);
  ok('availability search excludes booked room', !r.data.rooms.some((x) => x._id === String(room._id)));

  // ---- payment
  r = await call('POST', '/payments', { bookingId: bid, method: 'card', cardNumber: '4242 4242 4242 4241' }, guest);
  ok('invalid (Luhn) card rejected', r.status === 400);
  r = await call('POST', '/payments', { bookingId: bid, method: 'card', cardNumber: '4000 0000 0000 0002' }, guest);
  ok('declined card -> 402, booking stays unpaid', r.status === 402);
  r = await call('POST', '/payments', { bookingId: bid, method: 'cash' }, guest);
  ok('guest cannot pay cash (403)', r.status === 403);
  r = await call('POST', '/payments', { bookingId: bid, method: 'card', cardNumber: '4242424242424242' }, staff);
  ok('other users (staff allowed) - staff can pay', r.status === 201);
  r = await call('GET', `/bookings/${bid}`, null, guest);
  ok('payment confirms booking', r.data.booking.status === 'confirmed' && r.data.booking.paymentStatus === 'paid');
  r = await call('POST', '/payments', { bookingId: bid, method: 'upi', upiId: 'a@b' }, guest);
  ok('double payment rejected', r.status === 409);
  const stored = await mongoose.connection.db.collection('payments').findOne({ status: 'success' });
  ok('only last 4 card digits stored', stored.cardLast4 === '4242' && !JSON.stringify(stored).includes('4242424242424242'));

  // ---- lifecycle
  r = await call('PUT', `/bookings/${bid}/status`, { status: 'checked-out' }, staff);
  ok('cannot skip check-in (409)', r.status === 409);
  r = await call('PUT', `/bookings/${bid}/status`, { status: 'checked-in' }, guest);
  ok('guest cannot check in (403)', r.status === 403);
  r = await call('PUT', `/bookings/${bid}/status`, { status: 'checked-in' }, staff);
  ok('staff can check in', r.status === 200 && r.data.booking.status === 'checked-in');
  r = await call('PUT', `/bookings/${bid}/cancel`, {}, guest);
  ok('cannot cancel checked-in booking', r.status === 409);
  r = await call('PUT', `/bookings/${bid}/status`, { status: 'checked-out' }, staff);
  ok('staff can check out', r.data.booking.status === 'checked-out');

  // ---- cancel + refund
  r = await call('POST', '/bookings', { room: room._id, checkIn: day(20), checkOut: day(21) }, guest);
  const b2 = r.data.booking._id;
  await call('POST', '/payments', { bookingId: b2, method: 'upi', upiId: 'guest@okbank' }, guest);
  r = await call('PUT', `/bookings/${b2}/cancel`, {}, guest);
  ok('cancel paid booking -> refunded', r.data.booking.status === 'cancelled' && r.data.booking.paymentStatus === 'refunded');
  r = await call('GET', '/bookings/my', null, guest);
  ok('guest sees only own bookings', r.data.count === 2);
  r = await call('GET', `/bookings/${bid}`, null, (await call('POST', '/auth/register', { name: 'X', email: 'x@t.com', password: 'secret1' })).data.token);
  ok("other guest cannot read someone else's booking (403)", r.status === 403);

  // ---- stale pending expiry
  r = await call('POST', '/bookings', { room: room._id, checkIn: day(30), checkOut: day(31) }, guest);
  const stale = r.data.booking._id;
  await mongoose.connection.db.collection('bookings').updateOne(
    { _id: new mongoose.Types.ObjectId(stale) }, { $set: { createdAt: new Date(Date.now() - 3600000) } });
  r = await call('POST', '/bookings', { room: room._id, checkIn: day(30), checkOut: day(31) }, admin);
  ok('unpaid pending booking expires after 30 min, freeing the room', r.status === 201);

  // ---- admin
  r = await call('GET', '/dashboard/stats', null, staff);
  ok('dashboard stats', r.status === 200 && r.data.totalRooms === 3 && r.data.revenueByMonth.length === 6 && r.data.totalRevenue === 2240);
  r = await call('GET', '/payments', null, admin);
  ok('payments list with total (refunded excluded)', r.status === 200 && r.data.total === 2240);
  const gid = (await User.findOne({ email: 'g@t.com' }))._id;
  r = await call('PUT', `/users/${gid}/role`, { role: 'staff' }, admin);
  ok('admin can change role', r.data.user.role === 'staff');
  r = await call('DELETE', `/users/${(await User.findOne({ email: 'admin@t.com' }))._id}`, null, admin);
  ok('admin cannot delete self', r.status === 409);
  r = await call('DELETE', `/rooms/${room._id}`, null, admin);
  ok('cannot delete room with active bookings', r.status === 409);

  console.log(`\nAll ${passed} checks passed.`);
  server.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
  process.exit(0);
})().catch((e) => {
  console.error('\nTEST FAILED:', e.message);
  process.exit(1);
});
