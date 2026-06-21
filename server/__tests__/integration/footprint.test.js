/**
 * Integration tests for Footprint APIs
 */
const request = require('supertest');
const app = require('../../app');
const db = require('../../config/database');

let testToken = '';
let targetLogId = null;

beforeAll(async () => {
  await db.runMigrations();

  // Create a user and fetch authorization token
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      username: 'trackerUser',
      email: 'tracker@domain.com',
      password: 'Password123'
    });
  
  testToken = registerRes.body.token;
});

afterAll(async () => {
  await new Promise((resolve) => db.db.close(resolve));
});

describe('Footprint API Integration Tests', () => {
  const mockEntry = {
    category: 'transport',
    subCategory: 'car_petrol',
    value: 50, // 50 km
    unit: 'km',
    date: '2026-06-19',
    notes: 'Commute to office'
  };

  test('POST /api/footprint - Should successfully log carbon activity and return equivalents', async () => {
    const res = await request(app)
      .post('/api/footprint')
      .set('Authorization', `Bearer ${testToken}`)
      .send(mockEntry);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.carbonKg).toBe(9.0); // 50 * 0.18 = 9.0
    expect(res.body.data.equivalents.carKm).toBe(50);
    expect(res.body.data.id).toBeDefined();

    targetLogId = res.body.data.id; // Save ID to test deletions
  });

  test('POST /api/footprint - Should log a second activity with no new achievements', async () => {
    const res = await request(app)
      .post('/api/footprint')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ ...mockEntry, notes: 'Second trip' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.newAchievements).toBeUndefined();
  });

  test('POST /api/footprint - Should return 400 validation error for negative distance', async () => {
    const invalidEntry = { ...mockEntry, value: -5 };
    const res = await request(app)
      .post('/api/footprint')
      .set('Authorization', `Bearer ${testToken}`)
      .send(invalidEntry);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/footprint - Should retrieve user logs list', async () => {
    const res = await request(app)
      .get('/api/footprint')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].category).toBe('transport');
  });

  test('GET /api/footprint/summary - Should compile summaries and trends', async () => {
    const res = await request(app)
      .get('/api/footprint/summary')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.totalEmissions).toBe(18.0);
    expect(res.body.breakdown.length).toBeGreaterThanOrEqual(1);
    expect(res.body.breakdown[0].category).toBe('transport');
  });

  test('DELETE /api/footprint/:id - Should delete the footprint log entry', async () => {
    const res = await request(app)
      .delete(`/api/footprint/${targetLogId}`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it's gone
    const checkRes = await request(app)
      .get('/api/footprint')
      .set('Authorization', `Bearer ${testToken}`);
    
    const found = checkRes.body.data.find(log => log.id === targetLogId);
    expect(found).toBeUndefined();
  });

  test('GET /api/footprint/metadata - Should retrieve calculator metadata options', async () => {
    const res = await request(app)
      .get('/api/footprint/metadata')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transport).toBeDefined();
  });

  test('DELETE /api/footprint/999999 - Should return 404 for non-existent entry', async () => {
    const res = await request(app)
      .delete('/api/footprint/999999')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/footprint - Should handle database error in createEntry', async () => {
    const FootprintEntry = require('../../models/FootprintEntry');
    const originalCreate = FootprintEntry.create;
    FootprintEntry.create = jest.fn().mockRejectedValue(new Error('Simulated DB Error'));

    const res = await request(app)
      .post('/api/footprint')
      .set('Authorization', `Bearer ${testToken}`)
      .send(mockEntry);

    expect(res.status).toBe(500);

    FootprintEntry.create = originalCreate;
  });

  test('GET /api/footprint - Should handle database error in getEntries', async () => {
    const FootprintEntry = require('../../models/FootprintEntry');
    const originalFindByUser = FootprintEntry.findByUser;
    FootprintEntry.findByUser = jest.fn().mockRejectedValue(new Error('Simulated DB Error'));

    const res = await request(app)
      .get('/api/footprint')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(500);

    FootprintEntry.findByUser = originalFindByUser;
  });

  test('DELETE /api/footprint/:id - Should handle database error in deleteEntry', async () => {
    const FootprintEntry = require('../../models/FootprintEntry');
    const originalDelete = FootprintEntry.delete;
    FootprintEntry.delete = jest.fn().mockRejectedValue(new Error('Simulated DB Error'));

    const res = await request(app)
      .delete('/api/footprint/1')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(500);

    FootprintEntry.delete = originalDelete;
  });

  test('GET /api/footprint/summary - Should handle database error in getSummary', async () => {
    const FootprintEntry = require('../../models/FootprintEntry');
    const originalGetCategorySummary = FootprintEntry.getCategorySummary;
    FootprintEntry.getCategorySummary = jest.fn().mockRejectedValue(new Error('Simulated DB Error'));

    const res = await request(app)
      .get('/api/footprint/summary')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(500);

    FootprintEntry.getCategorySummary = originalGetCategorySummary;
  });
});
