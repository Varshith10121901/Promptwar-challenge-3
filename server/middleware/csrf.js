/**
 * CSRF Protection Middleware
 */
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * CSRF Protection Middleware
 * Generates a signed HTTPOnly cookie '_csrf' on GET/HEAD/OPTIONS requests if not present.
 * For POST, PUT, DELETE, PATCH requests, compares client X-CSRF-Token header with the cookie.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const csrfMiddleware = (req, res, next) => {
  // Bypass CSRF checks in test environment unless specifically testing CSRF behavior
  if (env.NODE_ENV === 'test' && !req.headers['x-test-csrf-enforce']) {
    return next();
  }

  // 1. Get or generate CSRF token
  let token = req.signedCookies ? req.signedCookies._csrf : null;

  if (!token) {
    token = crypto.randomUUID();
    res.cookie('_csrf', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      signed: true,
      path: '/'
    });
  }

  // 2. Validate token on state-modifying requests
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (stateChangingMethods.includes(req.method)) {
    const clientToken = req.headers['x-csrf-token'] || req.headers['xsrf-token'];

    if (!clientToken || clientToken !== token) {
      logger.warn('CSRF validation failed', {
        method: req.method,
        url: req.originalUrl,
        hasClientToken: !!clientToken,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        message: 'Invalid or missing CSRF token. Request aborted for security.'
      });
    }
  }

  next();
};

module.exports = csrfMiddleware;
