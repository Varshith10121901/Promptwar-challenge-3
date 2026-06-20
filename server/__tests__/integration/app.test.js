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
});
