/**
 * Unit tests for User, Challenge, Achievement, and FootprintEntry models
 */
const db = require('../../config/database');
const User = require('../../models/User');
const Challenge = require('../../models/Challenge');
const Achievement = require('../../models/Achievement');
const FootprintEntry = require('../../models/FootprintEntry');

describe('Models Unit Tests', () => {
  let userId;

  beforeAll(async () => {
    // Database is automatically initialized as an in-memory DB by database.js in test env
    await db.runMigrations();
  });

  beforeEach(async () => {
    // Clean tables
    await db.run('DELETE FROM user_achievements');
    await db.run('DELETE FROM user_challenges');
    await db.run('DELETE FROM footprint_entries');
    await db.run('DELETE FROM users');

    // Create a dummy user
    const res = await User.create('modeluser', 'model@test.com', 'password123');
    userId = res.id;
  });

  describe('User Model', () => {
    test('updateStreak should throw error if user not found', async () => {
      await expect(User.updateStreak(99999)).rejects.toThrow('User not found');
    });

    test('updateStreak when last_active_date is null', async () => {
      const info = await User.updateStreak(userId);
      expect(info.streakDays).toBe(1);
      
      const user = await User.findById(userId);
      expect(user.streak_days).toBe(1);
    });

    test('updateStreak when last_active_date is today', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      await db.run('UPDATE users SET streak_days = 3, last_active_date = ? WHERE id = ?', [todayStr, userId]);
      
      const info = await User.updateStreak(userId);
      expect(info.streakDays).toBe(3); // stays the same
    });

    test('updateStreak when last_active_date is 1 day ago', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await db.run('UPDATE users SET streak_days = 3, last_active_date = ? WHERE id = ?', [yesterdayStr, userId]);
      
      const info = await User.updateStreak(userId);
      expect(info.streakDays).toBe(4); // increments
    });

    test('updateStreak when last_active_date is 2 days ago', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

      await db.run('UPDATE users SET streak_days = 5, last_active_date = ? WHERE id = ?', [twoDaysAgoStr, userId]);
      
      const info = await User.updateStreak(userId);
      expect(info.streakDays).toBe(1); // resets
    });

    test('findByUsername/findByEmail should return null if not found', async () => {
      const u1 = await User.findByUsername('non_existing');
      expect(u1).toBeNull();

      const u2 = await User.findByEmail('non_existing@test.com');
      expect(u2).toBeNull();
    });

    test('findById should return null if not found', async () => {
      const u = await User.findById(99999);
      expect(u).toBeNull();
    });

    test('updateGoal should return false if user not found', async () => {
      const success = await User.updateGoal(99999, 300.0);
      expect(success).toBe(false);
    });
  });

  describe('Challenge Model', () => {
    let challengeId;

    beforeEach(async () => {
      // Find a default seeded challenge ID
      const all = await Challenge.listAll();
      challengeId = all[0].id;
    });

    test('enroll should throw if already active', async () => {
      await Challenge.enroll(userId, challengeId);
      await expect(Challenge.enroll(userId, challengeId)).rejects.toThrow('You are already enrolled in this challenge');
    });

    test('enroll should throw if already completed', async () => {
      await Challenge.enroll(userId, challengeId);
      await Challenge.complete(userId, challengeId);
      await expect(Challenge.enroll(userId, challengeId)).rejects.toThrow('You have already completed this challenge');
    });

    test('updateChallengeStatus should update and return true/false', async () => {
      await Challenge.enroll(userId, challengeId);
      const ok = await Challenge.updateChallengeStatus(userId, challengeId, 'failed');
      expect(ok).toBe(true);

      const notOk = await Challenge.updateChallengeStatus(userId, 99999, 'completed');
      expect(notOk).toBe(false);
    });

    test('findById should return undefined if not found', async () => {
      const c = await Challenge.findById(99999);
      expect(c).toBeUndefined();
    });

    test('enroll should succeed when previous enrollment status is failed', async () => {
      await Challenge.enroll(userId, challengeId);
      await Challenge.updateChallengeStatus(userId, challengeId, 'failed');
      const result = await Challenge.enroll(userId, challengeId);
      expect(result).toEqual(expect.objectContaining({
        userId,
        challengeId,
        status: 'active'
      }));
    });
  });

  describe('Achievement Model', () => {
    test('award catch block on database error', async () => {
      const runSpy = jest.spyOn(db, 'run').mockRejectedValueOnce(new Error('DB simulated error'));
      const success = await Achievement.award(userId, 1);
      expect(success).toBe(false);
      runSpy.mockRestore();
    });

    test('checkAndAward when user not found', async () => {
      const newlyEarned = await Achievement.checkAndAward(99999);
      expect(newlyEarned).toEqual([]);
    });

    test('checkAndAward catch block on database error', async () => {
      const getSpy = jest.spyOn(db, 'get').mockRejectedValueOnce(new Error('DB simulated error'));
      const newlyEarned = await Achievement.checkAndAward(userId);
      expect(newlyEarned).toEqual([]);
      getSpy.mockRestore();
    });

    test('checkAndAward fallback when logCountRes is null', async () => {
      const originalGet = db.get;
      db.get = jest.fn().mockImplementation((sql, params) => {
        if (sql.includes('COUNT(*) as count FROM footprint_entries')) {
          return Promise.resolve(null);
        }
        return originalGet(sql, params);
      });

      const newlyEarned = await Achievement.checkAndAward(userId);
      expect(newlyEarned).toBeDefined();

      db.get = originalGet;
    });

    test('checkAndAward fallback when award changes is 0', async () => {
      const originalRun = db.run;
      db.run = jest.fn().mockImplementation((sql, params) => {
        if (sql.includes('INSERT OR IGNORE INTO user_achievements')) {
          return Promise.resolve({ changes: 0 });
        }
        return originalRun(sql, params);
      });

      await originalRun('UPDATE users SET streak_days = 7 WHERE id = ?', [userId]);

      const newlyEarned = await Achievement.checkAndAward(userId);
      expect(newlyEarned).toEqual([]);

      db.run = originalRun;
    });

    test('checkAndAward criteria validation: streak, category logs', async () => {
      // Set user streak_days to 7
      await db.run('UPDATE users SET streak_days = 7 WHERE id = ?', [userId]);

      // Add 5 transport logs and 10 food logs
      for (let i = 0; i < 5; i++) {
        await FootprintEntry.create(userId, {
          category: 'transport',
          subCategory: 'car_petrol',
          value: 10,
          unit: 'km',
          carbonKg: 1.8,
          date: '2026-06-01'
        });
      }
      for (let i = 0; i < 10; i++) {
        await FootprintEntry.create(userId, {
          category: 'food',
          subCategory: 'vegetarian_meal',
          value: 1,
          unit: 'meals',
          carbonKg: 0.5,
          date: '2026-06-01'
        });
      }

      // Check accomplishments (should unlock multiple achievements)
      const newlyEarned = await Achievement.checkAndAward(userId);
      expect(newlyEarned.length).toBeGreaterThan(0);

      // Verify already earned check (next call returns nothing new)
      const again = await Achievement.checkAndAward(userId);
      expect(again).toEqual([]);
    });
  });

  describe('FootprintEntry Model', () => {
    test('findByIdAndUser returns undefined if not found', async () => {
      const entry = await FootprintEntry.findByIdAndUser(99999, userId);
      expect(entry).toBeUndefined();
    });

    test('findByUser with default parameters', async () => {
      await FootprintEntry.create(userId, {
        category: 'transport',
        subCategory: 'car_petrol',
        value: 15,
        unit: 'km',
        carbonKg: 2.7,
        date: '2026-06-01'
      });
      const entries = await FootprintEntry.findByUser(userId);
      expect(entries.length).toBe(1);
    });

    test('findByUser with custom parameters', async () => {
      await FootprintEntry.create(userId, {
        category: 'transport',
        subCategory: 'car_petrol',
        value: 15,
        unit: 'km',
        carbonKg: 2.7,
        date: '2026-06-01'
      });
      const entries = await FootprintEntry.findByUser(userId, 5, 0);
      expect(entries.length).toBe(1);
    });

    test('getDailyTrends with default and custom parameters', async () => {
      await FootprintEntry.create(userId, {
        category: 'energy',
        subCategory: 'electricity_grid',
        value: 100,
        unit: 'kWh',
        carbonKg: 50.0,
        date: new Date().toISOString().split('T')[0]
      });

      const trendsDefault = await FootprintEntry.getDailyTrends(userId);
      expect(trendsDefault.length).toBeGreaterThanOrEqual(1);

      const trendsCustom = await FootprintEntry.getDailyTrends(userId, 10);
      expect(trendsCustom.length).toBeGreaterThanOrEqual(1);
    });
  });
});
