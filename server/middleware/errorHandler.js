/**
 * Centralized Error Handling Middleware
 */
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Express error handling middleware
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  
  const response = {
    success: false,
    message: err.message || 'An unexpected server error occurred.'
  };

  // Stack trace only shown in development/testing mode
  if (env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  // Log the error
  logger.error('API Error Response', {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message: err.message,
    stack: err.stack
  });

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
