const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'];

// Set a mock io object to prevent crashes on socket events in serverless environments
const mockIo = {
  emit: () => {},
  to: () => ({ emit: () => {} }),
  in: () => ({ emit: () => {} })
};
app.set('io', mockIo);

// Security Headers Setup
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Trust proxy - always enabled for cloud deployments (Render, Netlify, etc.)
app.set('trust proxy', 1);

// API Rate Limiting Setup
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Disable all proxy validation checks
});

// Apply rate limiting to API routes
if (!process.env.NETLIFY) {
  app.use('/api', apiLimiter);
}

// Core Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Core Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/artwork', require('./routes/artwork'));
app.use('/api/social', require('./routes/social'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/community', require('./routes/community'));
app.use('/api/groups', require('./routes/groupChat'));
app.use('/api/competition', require('./routes/competition'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/reports', require('./routes/report'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/comics', require('./routes/comics'));
app.use('/api/arthistory', require('./routes/artHistory'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/marketplace', require('./routes/marketplace'));

// New E-commerce Module Routes
app.use('/api/products', require('./routes/product'));
app.use('/api/orders', require('./routes/order'));

// AI Mentor Recommendation Module
app.use('/api/mentors', require('./routes/mentors'));

// Root Endpoint
app.get('/', (req, res) => res.json({ message: '🎨 Artory API Running' }));

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
