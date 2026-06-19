/**
 * Integration tests for Auth APIs
 */
const request = require('supertest');
const app = require('../../app');
const db = require('../../config/database');

beforeAll(async () => {
  // Ensure migrations are run on the test memory DB
  await db.runMigrations();
});

afterAll(async () => {
  // Close database connections safely
  await new Promise((resolve) => db.db.close(resolve));
});

describe('Auth API Integration Tests', () => {
  const testUser = {
    username: 'testrunner',
    email: 'runner@test.com',
    password: 'superpassword123'
  };
  
  let userToken = '';

  test('POST /api/auth/register - Should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(211);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe(testUser.username);
  });

  test('POST /api/auth/register - Should return 409 for duplicate username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register - Should return 400 validation error for short password', async () => {
    const invalidUser = {
      username: 'shorty',
      email: 'short@test.com',
      password: '123' // too short
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(invalidUser);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login - Should log in user and return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    
    userToken = res.body.token; // Save token for protected endpoints testing
  });

  test('GET /api/auth/profile - Should return user details for authenticated requests', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.achievements).toBeDefined();
  });

  test('GET /api/auth/profile - Should return 401 for requests missing JWT header', async () => {
    const res = await request(app)
      .get('/api/auth/profile');

    expect(res.status).toBe(401);
  });

  test('PUT /api/auth/goal - Should update monthly carbon budget target', async () => {
    const res = await request(app)
      .put('/api/auth/goal')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ carbonGoal: 420.0 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.carbonGoal).toBe(420.0);
  });
});
