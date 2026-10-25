const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const routes = require('./routes');
const sanitize = require('./middleware/sanitize');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// Keep an explicit allowlist. CLIENT_URL may contain comma-separated production
// and preview origins; the deployed frontend origin is included as a safe default.
const allowedOrigins = new Set([
  'https://frontend-two-pi-55.vercel.app',
  'http://localhost:5173',
  ...(process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean),
]);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(sanitize);
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Vercel runs the exported Express app directly, so server.js's connectDB()
// startup code is not guaranteed to run. Connect lazily for API requests and
// reuse the connection across warm serverless invocations.
let mongoConnectionPromise;
async function ensureMongoConnected() {
  if (mongoose.connection.readyState === 1) return;
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

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'not-connected',
    time: new Date(),
  });
});

// Do not let Mongoose buffer queries forever when Atlas is unreachable.
app.use('/api', async (req, res, next) => {
  try {
    await ensureMongoConnected();
    next();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    res.status(503).json({
      message: 'Database unavailable. Check MONGO_URI and MongoDB Atlas Network Access.',
    });
  }
});

// brute-force protection on login / register
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 10000 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts. Please try again later.' },
  })
);

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
