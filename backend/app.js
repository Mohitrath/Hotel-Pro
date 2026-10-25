const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');

const routes = require('./routes');
const Room = require('./models/Room');
const sanitize = require('./middleware/sanitize');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

const allowedOrigins = new Set([
  'https://frontend-two-pi-55.vercel.app',
  'http://localhost:5173',
  ...(process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean),
]);

function isAllowedOrigin(origin) {
  if (!origin || allowedOrigins.has(origin)) return true;
  try {
    const parsed = new URL(origin);
    // Vercel generates a distinct hostname for each production/preview deploy.
    // Permit only HTTPS Vercel-hosted frontends in addition to explicit origins.
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));
app.options('*', cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: '1mb' }));
app.use(sanitize);
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Serve static files from public directory (includes Vercel Analytics)
app.use(express.static(path.join(__dirname, 'public')));

let mongoConnectionPromise;
let seedPromise;
async function ensureMongoConnected() {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');
    if (!mongoConnectionPromise) {
      mongoConnectionPromise = mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      }).catch((err) => {
        mongoConnectionPromise = undefined;
        throw err;
      });
    }
    await mongoConnectionPromise;
  }

  if (!seedPromise) {
    const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;
    const rooms = [
      ['101', 'Single', 1, 1800, 1, ['WiFi', 'AC', 'TV', 'Hot Water'], 'Cozy single room ideal for solo travellers.', 'photo-1631049307264-da0ec9d70304'],
      ['102', 'Single', 1, 1900, 1, ['WiFi', 'AC', 'TV', 'Work Desk'], 'Quiet single room with a dedicated work desk.', 'photo-1590490360182-c33d57733427'],
      ['103', 'Double', 1, 2800, 2, ['WiFi', 'AC', 'TV', 'Mini Fridge'], 'Comfortable double room with a queen-size bed.', 'photo-1611892440504-42a792e24d32'],
      ['104', 'Double', 1, 3000, 3, ['WiFi', 'AC', 'TV', 'Balcony'], 'Spacious double room with a private balcony.', 'photo-1618773928121-c32242e63f39'],
      ['201', 'Double', 2, 3200, 2, ['WiFi', 'AC', 'TV', 'City View'], 'Bright double room with a city view.', 'photo-1566665797739-1674de7a421a'],
      ['202', 'Deluxe', 2, 4500, 3, ['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Bathtub'], 'Deluxe room with king bed and bathtub.', 'photo-1578683010236-d716f9a3f461'],
      ['203', 'Deluxe', 2, 4800, 3, ['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony'], 'Deluxe room with a large balcony.', 'photo-1595576508898-0ad5c879a061'],
      ['204', 'Deluxe', 2, 5000, 4, ['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Sofa'], 'Family deluxe room with a sitting area.', 'photo-1582719478250-c89cae4dc85b'],
      ['301', 'Suite', 3, 7500, 4, ['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Jacuzzi', 'Lounge'], 'Executive suite with separate lounge and jacuzzi.', 'photo-1591088398332-8a7791972843'],
      ['302', 'Suite', 3, 8500, 4, ['WiFi', 'AC', 'Smart TV', 'Kitchenette', 'Jacuzzi', 'Lounge'], 'Premium suite with kitchenette and panoramic view.', 'photo-1560185007-cde436f6a4d0'],
      ['303', 'Suite', 3, 12000, 6, ['WiFi', 'AC', 'Smart TV', 'Kitchenette', 'Private Dining', 'Jacuzzi'], 'Presidential suite for large families and VIPs.', 'photo-1512918728675-ed5a9ecdebfd'],
      ['105', 'Single', 1, 1700, 1, ['WiFi', 'AC', 'TV'], 'Economy single room (currently under maintenance).', 'photo-1505693416388-ac5ce068fe85', 'maintenance'],
    ];
    seedPromise = Promise.all(rooms.map(([number, type, floor, price, capacity, amenities, description, photo, status]) =>
      Room.updateOne(
        { number },
        { $setOnInsert: { number, type, floor, price, capacity, amenities, description, image: img(photo), status: status || 'available' } },
        { upsert: true, runValidators: true }
      )
    )).catch((err) => {
      seedPromise = undefined;
      throw err;
    });
  }
  await seedPromise;
}

app.get('/api/health', async (_req, res) => {
  try {
    await ensureMongoConnected();
    res.json({ status: 'ok', database: 'connected', roomsSeeded: true, time: new Date() });
  } catch (err) {
    console.error('MongoDB health check failed:', err.message);
    res.status(503).json({
      status: 'error',
      database: 'unavailable',
      message: 'Database unavailable. Verify MONGO_URI, database-user credentials, and Atlas Network Access.',
    });
  }
});

app.use('/api', async (req, res, next) => {
  try {
    await ensureMongoConnected();
    next();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    res.status(503).json({
      message: 'Database unavailable. Verify MONGO_URI, database-user credentials, and Atlas Network Access.',
    });
  }
});

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
}));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
