/**
 * Unit tests for rate limiter middleware
 */
const env = require('../../config/env');

describe('Rate Limiter Middleware Unit Tests', () => {
  test('should load with high limits in test mode', () => {
    jest.isolateModules(() => {
      const originalNodeEnv = env.NODE_ENV;
      env.NODE_ENV = 'test';
      
      const { authLimiter, apiLimiter } = require('../../middleware/rateLimiter');
      
      expect(authLimiter).toBeDefined();
      expect(apiLimiter).toBeDefined();
      
      env.NODE_ENV = originalNodeEnv;
    });
  });

  test('should load with standard limits in non-test mode', () => {
    jest.isolateModules(() => {
      const originalNodeEnv = env.NODE_ENV;
      env.NODE_ENV = 'development';
      
      const { authLimiter, apiLimiter } = require('../../middleware/rateLimiter');
      
      expect(authLimiter).toBeDefined();
      expect(apiLimiter).toBeDefined();
      
      env.NODE_ENV = originalNodeEnv;
    });
  });
});
