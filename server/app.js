/**
 * Core Express Application Setup
 */
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const footprintRoutes = require('./routes/footprintRoutes');
const insightsRoutes = require('./routes/insightsRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const educationRoutes = require('./routes/educationRoutes');

const app = express();

// Security configuration (Helmet headers + custom CSP for Chart.js CDN, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.'],
      fontSrc: ["'self'", 'https://fonts.gstatic.'],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
      connectSrc: ["'self'"]
    }
  }
}));

// Compression middleware
app.use(compression());

// Parse incoming payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request tracing middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration
    });
  });
  next();
});

// Serve frontend static assets from public/ directory
app.use(express.static(path.join(__dirname, '../public')));

// API route mappings
app.use('/api/auth', authRoutes);
app.use('/api/footprint', footprintRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/education', educationRoutes);

// Fallback to index.html for single-page style navigation
app.get('*', (req, res, _next) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
