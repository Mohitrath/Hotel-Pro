const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

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
      // Requests without an Origin header (health checks/server-to-server) are allowed.
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(sanitize);
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

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

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
