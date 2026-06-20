/**
 * Core Express Application Setup
 */
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const env = require('./config/env');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const csrfMiddleware = require('./middleware/csrf');
const sanitizeInput = require('./middleware/sanitize');

// Route imports
const authRoutes = require('./routes/authRoutes');
const footprintRoutes = require('./routes/footprintRoutes');
const insightsRoutes = require('./routes/insightsRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const educationRoutes = require('./routes/educationRoutes');

const app = express();

// 1. Security configuration (Helmet headers + custom CSP for Chart.js CDN, etc.)
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
  },
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// Custom security headers
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), interest-cohort=()');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// 2. CORS configuration
app.use(cors({
  origin: env.NODE_ENV === 'production' ? ['https://yourproductiondomain.com'] : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// 3. Compression middleware
app.use(compression());

// 4. Parse incoming cookies
app.use(cookieParser(env.JWT_SECRET));

// 5. Parse incoming payloads with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// 6. XSS Input Sanitization
app.use(sanitizeInput);

// 7. CSRF Protection
app.use(csrfMiddleware);

// CSRF token provider endpoint
app.get('/api/security/csrf', (req, res) => {
  const token = req.signedCookies._csrf;
  res.json({ csrfToken: token });
});

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
