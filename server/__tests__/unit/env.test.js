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

  test('should fallback to default database file if not specified', () => {
    const originalEnvSecret = process.env.JWT_SECRET;
    const originalDbFile = process.env.DATABASE_FILE;
    process.env.JWT_SECRET = 'some_dummy_jwt_secret_token';
    delete process.env.DATABASE_FILE;
    
    try {
      const envConfig = require('../../config/env');
      expect(envConfig.DATABASE_FILE).toBe('./database.sqlite');
    } finally {
      process.env.JWT_SECRET = originalEnvSecret;
      process.env.DATABASE_FILE = originalDbFile;
    }
  });

  test('should fallback to default PORT, NODE_ENV, and CACHE_TTL if not specified', () => {
    const originalEnvSecret = process.env.JWT_SECRET;
    const originalPort = process.env.PORT;
    const originalNodeEnv = process.env.NODE_ENV;
    const originalCacheTtl = process.env.CACHE_TTL;

    process.env.JWT_SECRET = 'some_dummy_jwt_secret_token';
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.CACHE_TTL;

    try {
      const envConfig = require('../../config/env');
      expect(envConfig.PORT).toBe(3000);
      expect(envConfig.NODE_ENV).toBe('development');
      expect(envConfig.CACHE_TTL).toBe(300);
    } finally {
      process.env.JWT_SECRET = originalEnvSecret;
      if (originalPort !== undefined) {
        process.env.PORT = originalPort;
      }
      if (originalNodeEnv !== undefined) {
        process.env.NODE_ENV = originalNodeEnv;
      }
      if (originalCacheTtl !== undefined) {
        process.env.CACHE_TTL = originalCacheTtl;
      }
    }
  });
});
