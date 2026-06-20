/**
 * Input sanitization middleware to prevent XSS attacks
 */

/**
 * Escape special HTML characters in a string
 * @param {string} str - Input string
 * @returns {string} Escaped string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') { return str; }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Recursively sanitize value (handles objects and arrays)
 * @param {any} val - Input value to sanitize
 * @returns {any} Sanitized value
 */
const sanitizeValue = (val) => {
  if (val === null || val === undefined) { return val; }
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map(sanitizeValue);
    }
    const sanitized = {};
    for (const key of Object.keys(val)) {
      sanitized[key] = sanitizeValue(val[key]);
    }
    return sanitized;
  }
  return sanitizeString(val);
};

/**
 * Middleware to sanitize req.body, req.query, and req.params
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
};

module.exports = sanitizeInput;
