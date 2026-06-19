/**
 * Challenge model database operations
 */
const db = require('../config/database');

const Challenge = {
  /**
   * Get all system challenges
   */
  listAll: async () => {
    const sql = 'SELECT * FROM challenges ORDER BY points DESC';
    return db.query(sql);
  },

  /**
   * Find a challenge by ID
   */
  findById: async (id) => {
    const sql = 'SELECT * FROM challenges WHERE id = ?';
    return db.get(sql, [id]);
  },

  /**
   * Get user challenge enrollments with full challenge details
   */
  findUserChallenges: async (userId) => {
    const sql = `
      SELECT uc.id as enrollment_id, c.*, uc.started_at, uc.completed_at, uc.status 
      FROM user_challenges uc
      JOIN challenges c ON uc.challenge_id = c.id
      WHERE uc.user_id = ?
      ORDER BY uc.started_at DESC
    `;
    return db.query(sql, [userId]);
  },

  /**
   * Enroll a user in a challenge
   */
  enroll: async (userId, challengeId) => {
    // Check if already active or completed
    const existing = await db.get(
      'SELECT id, status FROM user_challenges WHERE user_id = ? AND challenge_id = ?',
      [userId, challengeId]
    );

    if (existing) {
      if (existing.status === 'active') {
        throw new Error('You are already enrolled in this challenge');
      }
      if (existing.status === 'completed') {
        throw new Error('You have already completed this challenge');
      }
    }

    const sql = `
      INSERT INTO user_challenges (user_id, challenge_id, status)
      VALUES (?, ?, 'active')
    `;
    const result = await db.run(sql, [userId, challengeId]);
    return { enrollmentId: result.id, userId, challengeId, status: 'active' };
  },

  /**
   * Complete an active challenge
   */
  complete: async (userId, challengeId) => {
    const sql = `
      UPDATE user_challenges 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND challenge_id = ? AND status = 'active'
    `;
    const result = await db.run(sql, [userId, challengeId]);
    return result.changes > 0;
  },

  /**
   * Check and auto-update user challenges progress
   * For simplicity, this triggers updates when achievements are checked, 
   * or a user can manually trigger it.
   */
  updateChallengeStatus: async (userId, challengeId, status) => {
    const sql = `
      UPDATE user_challenges 
      SET status = ? 
      WHERE user_id = ? AND challenge_id = ?
    `;
    const result = await db.run(sql, [status, userId, challengeId]);
    return result.changes > 0;
  }
};

module.exports = Challenge;
