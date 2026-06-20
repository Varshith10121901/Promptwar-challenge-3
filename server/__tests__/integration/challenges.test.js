/**
 * Integration tests for Challenges and Education APIs
 */
const request = require('supertest');
const app = require('../../app');
const db = require('../../config/database');

let testToken = '';

beforeAll(async () => {
  await db.runMigrations();

  // Create a user and fetch authorization token
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      username: 'gamerUser',
      email: 'gamer@domain.com',
      password: 'Password123'
    });
  
  testToken = registerRes.body.token;
});

afterAll(async () => {
  await new Promise((resolve) => db.db.close(resolve));
});

describe('Challenges & Education API Integration Tests', () => {
  test('GET /api/challenges - Should return all challenges successfully', async () => {
    const res = await request(app)
      .get('/api/challenges')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBeDefined();
  });

  test('POST /api/challenges/enroll - Should enroll user in challenge', async () => {
    const res = await request(app)
      .post('/api/challenges/enroll')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ challengeId: 1 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('active');
  });

  test('POST /api/challenges/enroll - Should fail to enroll twice in active challenge', async () => {
    const res = await request(app)
      .post('/api/challenges/enroll')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ challengeId: 1 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/challenges/user - Should return enrolled challenges list', async () => {
    const res = await request(app)
      .get('/api/challenges/user')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('POST /api/challenges/complete/:id - Should mark challenge completed and award points', async () => {
    const res = await request(app)
      .post('/api/challenges/complete/1')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pointsEarned).toBeDefined();
  });

  test('GET /api/education - Should return articles and facts', async () => {
    const res = await request(app)
      .get('/api/education');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.articles.length).toBeGreaterThan(0);
    expect(res.body.facts.length).toBeGreaterThan(0);
  });

  test('GET /api/insights - Should return insights checklist', async () => {
    const res = await request(app)
      .get('/api/insights')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendations).toBeDefined();
  });

  test('POST /api/challenges/enroll - Should fail with 404 for non-existent challenge', async () => {
    const res = await request(app)
      .post('/api/challenges/enroll')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ challengeId: 999999 });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/challenges/complete/:id - Should fail with 404 for non-existent challenge', async () => {
    const res = await request(app)
      .post('/api/challenges/complete/999999')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/challenges/complete/:id - Should return 400 if user is not enrolled', async () => {
    const res = await request(app)
      .post('/api/challenges/complete/2')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not active in this challenge');
  });

  test('GET /api/challenges - Should handle database error in listChallenges', async () => {
    const Challenge = require('../../models/Challenge');
    const originalListAll = Challenge.listAll;
    Challenge.listAll = jest.fn().mockRejectedValue(new Error('Simulated DB Error'));

    const res = await request(app)
      .get('/api/challenges')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);

    Challenge.listAll = originalListAll;
  });

  test('GET /api/challenges/user - Should handle database error in getUserChallenges', async () => {
    const Challenge = require('../../models/Challenge');
    const originalFindUserChallenges = Challenge.findUserChallenges;
    Challenge.findUserChallenges = jest.fn().mockRejectedValue(new Error('Simulated DB Error'));

    const res = await request(app)
      .get('/api/challenges/user')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);

    Challenge.findUserChallenges = originalFindUserChallenges;
  });

  test('POST /api/challenges/enroll - Should handle unexpected database error in enrollInChallenge', async () => {
    const Challenge = require('../../models/Challenge');
    const originalEnroll = Challenge.enroll;
    Challenge.enroll = jest.fn().mockRejectedValue(new Error('Simulated DB Error'));

    const res = await request(app)
      .post('/api/challenges/enroll')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ challengeId: 2 });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);

    Challenge.enroll = originalEnroll;
  });

  test('POST /api/challenges/complete/:id - Should handle unexpected database error in completeChallenge', async () => {
    const Challenge = require('../../models/Challenge');
    const originalComplete = Challenge.complete;
    Challenge.complete = jest.fn().mockRejectedValue(new Error('Simulated DB Error'));

    // First enroll in challenge 2
    await request(app)
      .post('/api/challenges/enroll')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ challengeId: 2 });

    const res = await request(app)
      .post('/api/challenges/complete/2')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);

    Challenge.complete = originalComplete;
  });
});
