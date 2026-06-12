// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── SECURITY MIDDLEWARE ──────────────────────────────────
// helmet sets secure HTTP headers
app.use(helmet());

// CORS: allows the React frontend (port 3000) to call this server
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true // allow cookies
}));

// Rate limiting: prevent abuse (max 100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// ── BODY PARSING MIDDLEWARE ──────────────────────────────
app.use(express.json({ limit: '10mb' })); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form data

// ── API ROUTES ───────────────────────────────────────────
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/sales', require('./src/routes/salesRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/predict', require('./src/routes/predictionRoutes'));

// ── HEALTH CHECK ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// ── ERROR HANDLING MIDDLEWARE ────────────────────────────
// This catches all errors thrown with next(err)
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`❌ Error [${req.method} ${req.path}]:`, err);

  res.status(status).json({
    error: message
  });
});

// ── START SERVER ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   ML Service:  ${process.env.ML_SERVICE_URL}`);
});