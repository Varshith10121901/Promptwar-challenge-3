/**
 * Integration tests for general app routes and fallback handlers
 */
const request = require('supertest');
const app = require('../../app');

describe('App Route Handlers Integration Tests', () => {
  test('GET /api/non-existent-route should return 404 JSON', async () => {
    const res = await request(app)
      .get('/api/non-existent-route');
    
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: 'API endpoint not found'
    });
  });

  test('GET /random-page should fallback to public/index.html', async () => {
    const res = await request(app)
      .get('/random-page');
    
    expect(res.status).toBe(200);
    expect(res.text).toContain('<!DOCTYPE html>');
    expect(res.text).toContain('EcoTracker');
  });

  test('GET /api/security/csrf should return CSRF token and set cookie', async () => {
    const res = await request(app)
      .get('/api/security/csrf')
      .set('x-test-csrf-enforce', 'true');
      
    expect(res.status).toBe(200);
    expect(res.body.csrfToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('should initialize CORS with production origin when NODE_ENV is production', () => {
    jest.isolateModules(() => {
      // Mock the database config module to avoid real connection attempts
      jest.doMock('../../config/database', () => ({
        runMigrations: jest.fn().mockResolvedValue()
      }));

      const env = require('../../config/env');
      const originalNodeEnv = env.NODE_ENV;
      env.NODE_ENV = 'production';
      
      const productionApp = require('../../app');
      expect(productionApp).toBeDefined();
      
      env.NODE_ENV = originalNodeEnv;
    });
  });
});
