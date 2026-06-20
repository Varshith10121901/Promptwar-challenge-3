/**
 * Unit tests for environment variable checks
 */
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('Environment Variables Unit Tests', () => {
  let originalExit, originalConsoleError;
  let exitMock, consoleErrorMock;

  beforeAll(() => {
    originalExit = process.exit;
    originalConsoleError = console.error;
  });

  afterAll(() => {
    process.exit = originalExit;
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    exitMock = jest.fn();
    process.exit = exitMock;
    consoleErrorMock = jest.fn();
    console.error = consoleErrorMock;
    
    // Reset module registry cache
    jest.resetModules();
  });

  test('should exit if required environment variables are missing', () => {
    // Clear JWT_SECRET
    const originalEnvSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    
    try {
      require('../../config/env');
      expect(exitMock).toHaveBeenCalledWith(1);
      expect(consoleErrorMock).toHaveBeenCalledWith(
        expect.stringContaining('Environment variable JWT_SECRET is required but missing.')
      );
    } finally {
      process.env.JWT_SECRET = originalEnvSecret;
    }
  });

  test('should load successfully if JWT_SECRET is present', () => {
    const originalEnvSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'some_dummy_jwt_secret_token';
    
    try {
      const envConfig = require('../../config/env');
      expect(exitMock).not.toHaveBeenCalled();
      expect(envConfig.JWT_SECRET).toBe('some_dummy_jwt_secret_token');
    } finally {
      process.env.JWT_SECRET = originalEnvSecret;
    }
  });
});
