/**
 * Integration tests for Insights APIs
 */
const request = require('supertest');
const app = require('../../app');
const db = require('../../config/database');
const cache = require('../../services/cacheService');
const User = require('../../models/User');

let testToken = '';

beforeAll(async () => {
  await db.runMigrations();

  // Create a user and fetch authorization token
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      username: 'insightUser',
      email: 'insights@domain.com',
      password: 'Password123'
    });
  
  testToken = registerRes.body.token;
});

afterAll(async () => {
  await new Promise((resolve) => db.db.close(resolve));
});

describe('Insights API Integration Tests', () => {
  beforeEach(() => {
    cache.flush();
  });

  test('GET /api/insights - Should generate fresh insights (live source)', async () => {
    const res = await request(app)
      .get('/api/insights')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.source).toBe('live');
    expect(res.body.data.recommendations).toBeDefined();
  });

  test('GET /api/insights - Should return cached insights on consecutive requests (cache source)', async () => {
    process.env.ENABLE_TEST_CACHE = 'true';
    try {
      // 1. First request generates live insights and caches them
      await request(app)
        .get('/api/insights')
        .set('Authorization', `Bearer ${testToken}`);

      // 2. Second request should hit the cache
      const res = await request(app)
        .get('/api/insights')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.source).toBe('cache');
    } finally {
      delete process.env.ENABLE_TEST_CACHE;
    }
  });

  test('GET /api/insights - Should return 404 if user does not exist', async () => {
    // Generate token for a non-existent user ID (e.g. 999999)
    const jwt = require('jsonwebtoken');
    const env = require('../../config/env');
    const fakeToken = jwt.sign({ id: 999999, username: 'ghost' }, env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .get('/api/insights')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/insights - Should handle database error gracefully', async () => {
    const originalFindById = User.findById;
    User.findById = jest.fn().mockRejectedValue(new Error('Simulated DB Error'));

    const res = await request(app)
      .get('/api/insights')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);

    User.findById = originalFindById;
  });
});
