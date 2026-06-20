/**
 * Unit tests for errorHandler middleware
 */
const errorHandler = require('../../middleware/errorHandler');
const env = require('../../config/env');
const logger = require('../../utils/logger');

jest.mock('../../utils/logger');

describe('ErrorHandler Middleware Unit Tests', () => {
  let req, res, next;
  let originalEnv;

  beforeAll(() => {
    originalEnv = env.NODE_ENV;
  });

  afterAll(() => {
    env.NODE_ENV = originalEnv;
  });

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/test-route'
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    logger.error.mockClear();
  });

  test('should handle standard error with status code and stack in development mode', () => {
    env.NODE_ENV = 'development';
    const err = new Error('Custom testing error');
    err.statusCode = 400;
    
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Custom testing error',
        stack: expect.any(String)
      })
    );
    expect(logger.error).toHaveBeenCalled();
  });

  test('should default to status code 500 and default error message if none specified', () => {
    env.NODE_ENV = 'development';
    const err = {}; // No message, no status, no stack
    
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'An unexpected server error occurred.'
    });
  });

  test('should hide stack trace in production mode', () => {
    env.NODE_ENV = 'production';
    const err = new Error('Sensitive error');
    err.statusCode = 500;
    
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Sensitive error'
    });
  });
});
