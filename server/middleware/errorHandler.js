/**
 * Centralized Error Handling Middleware
 */
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Express error handling middleware
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} _next - Express next middleware function
 * @returns {Object} JSON response with error details
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  
  const response = {
    success: false,
    message: err.message || 'An unexpected server error occurred.'
  };

  if (err.errors) {
    response.errors = err.errors;
  }

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
    errors: err.errors,
    stack: err.stack
  });

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
