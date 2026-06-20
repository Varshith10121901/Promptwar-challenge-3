/**
 * Unit tests for logger utility
 */
const logger = require('../../utils/logger');
const env = require('../../config/env');

describe('Logger Utility Unit Tests', () => {
  let logSpy, warnSpy, errorSpy;
  let originalEnv;

  beforeAll(() => {
    originalEnv = env.NODE_ENV;
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    env.NODE_ENV = originalEnv;
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  beforeEach(() => {
    logSpy.mockClear();
    warnSpy.mockClear();
    errorSpy.mockClear();
  });

  test('should log info in non-test environment', () => {
    env.NODE_ENV = 'development';
    logger.info('test info', { key: 'value' });
    
    expect(logSpy).toHaveBeenCalled();
    const payload = JSON.parse(logSpy.mock.calls[0][0]);
    expect(payload.level).toBe('info');
    expect(payload.message).toBe('test info');
    expect(payload.key).toBe('value');
  });

  test('should mute info in test environment', () => {
    env.NODE_ENV = 'test';
    logger.info('test info');
    expect(logSpy).not.toHaveBeenCalled();
  });

  test('should log warn', () => {
    env.NODE_ENV = 'test';
    logger.warn('test warn');
    expect(warnSpy).toHaveBeenCalled();
    const payload = JSON.parse(warnSpy.mock.calls[0][0]);
    expect(payload.level).toBe('warn');
    expect(payload.message).toBe('test warn');
  });

  test('should log error', () => {
    env.NODE_ENV = 'test';
    logger.error('test error', { err: 'details' });
    expect(errorSpy).toHaveBeenCalled();
    const payload = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(payload.level).toBe('error');
    expect(payload.message).toBe('test error');
    expect(payload.err).toBe('details');
  });
});
