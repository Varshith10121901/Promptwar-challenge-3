/**
 * Custom AppError and subclasses for expressive error handling
 */

class AppError extends Error {
  /**
   * Create an AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {any} [errors] - Optional validation error details
   */
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  /**
   * Create a ValidationError
   * @param {string} [message] - Error message
   * @param {any} [errors] - Validation details
   */
  constructor(message, errors = null) {
    super(message || 'Validation failed', 400, errors);
  }
}

class AuthenticationError extends AppError {
  /**
   * Create an AuthenticationError
   * @param {string} [message] - Error message
   */
  constructor(message) {
    super(message || 'Authentication failed', 401);
  }
}

class ForbiddenError extends AppError {
  /**
   * Create a ForbiddenError
   * @param {string} [message] - Error message
   */
  constructor(message) {
    super(message || 'Access forbidden', 403);
  }
}

class NotFoundError extends AppError {
  /**
   * Create a NotFoundError
   * @param {string} [message] - Error message
   */
  constructor(message) {
    super(message || 'Resource not found', 404);
  }
}

class ConflictError extends AppError {
  /**
   * Create a ConflictError
   * @param {string} [message] - Error message
   */
  constructor(message) {
    super(message || 'Conflict occurred', 409);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError
};
