/**
 * Unit tests for cache service
 */
const cache = require('../../services/cacheService');
const env = require('../../config/env');

describe('Cache Service Unit Tests', () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = env.NODE_ENV;
  });

  afterAll(() => {
    env.NODE_ENV = originalEnv;
  });

  test('should return null in test environment', () => {
    env.NODE_ENV = 'test';
    cache.set('test_key', 'test_value');
    expect(cache.get('test_key')).toBeNull();
  });

  test('should store, retrieve, delete and flush values when not in test environment', () => {
    // Temporarily switch environment to development to test cache functionality
    env.NODE_ENV = 'development';
    
    // Test set and get
    cache.set('dev_key', 'dev_value', 10);
    expect(cache.get('dev_key')).toBe('dev_value');

    // Test delete
    cache.del('dev_key');
    expect(cache.get('dev_key')).toBeUndefined();

    // Test flush
    cache.set('key1', 'val1');
    cache.set('key2', 'val2');
    cache.flush();
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
  });
});
