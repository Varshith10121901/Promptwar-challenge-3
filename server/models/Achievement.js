/**
 * Achievement model database operations
 */
const db = require('../config/database');
const logger = require('../utils/logger');

const Achievement = {
  /**
   * List all system achievements
   */
  listAll: async () => {
    const sql = 'SELECT * FROM achievements ORDER BY id ASC';
    return db.query(sql);
  },

  /**
   * Find achievements earned by a user
   */
  findUserAchievements: async (userId) => {
    const sql = `
      SELECT ua.earned_at, a.* 
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.earned_at DESC
    `;
    return db.query(sql, [userId]);
  },

  /**
   * Award an achievement to a user
   */
  award: async (userId, achievementId) => {
    try {
      const sql = `
        INSERT OR IGNORE INTO user_achievements (user_id, achievement_id)
        VALUES (?, ?)
      `;
      const result = await db.run(sql, [userId, achievementId]);
      return result.changes > 0;
    } catch (err) {
      logger.error('Error awarding achievement', { userId, achievementId, error: err.message });
      return false;
    }
  },

  /**
   * Scan user progress and unlock qualifying achievements.
   * @param {number} userId 
   * @returns {Promise<Array>} List of newly earned achievements
   */
  checkAndAward: async (userId) => {
    const newlyEarned = [];

    try {
      // 1. Fetch user data (streak)
      const user = await db.get('SELECT streak_days FROM users WHERE id = ?', [userId]);
      if (!user) {
        return [];
      }

      // 2. Fetch footprint logging count
      const logCountRes = await db.get('SELECT COUNT(*) as count FROM footprint_entries WHERE user_id = ?', [userId]);
      const totalLogs = logCountRes ? logCountRes.count : 0;

      // 3. Fetch logs grouped by category
      const transportLogs = await db.get(
        "SELECT COUNT(*) as count FROM footprint_entries WHERE user_id = ? AND category = 'transport'",
        [userId]
      );
      const foodLogs = await db.get(
        "SELECT COUNT(*) as count FROM footprint_entries WHERE user_id = ? AND category = 'food'",
        [userId]
      );

      // 4. Fetch all system achievements
      const allAchievements = await Achievement.listAll();

      // 5. Fetch already earned achievements
      const earned = await Achievement.findUserAchievements(userId);
      const earnedIds = new Set(earned.map(a => a.id));

      // 6. Check qualifications
      for (const ach of allAchievements) {
        if (earnedIds.has(ach.id)) {
          continue; // Already earned
        }

        const [criteriaType, criteriaDetail, criteriaValue] = ach.criteria.split(':');
        let qualified = false;

        if (criteriaType === 'log') {
          const reqLogs = parseInt(criteriaDetail, 10);
          if (totalLogs >= reqLogs) {
            qualified = true;
          }
        } else if (criteriaType === 'streak') {
          const reqStreak = parseInt(criteriaDetail, 10);
          if (user.streak_days >= reqStreak) {
            qualified = true;
          }
        } else if (criteriaType === 'category') {
          const category = criteriaDetail;
          const reqCount = parseInt(criteriaValue, 10);
          if (category === 'transport' && transportLogs.count >= reqCount) {
            qualified = true;
          }
          if (category === 'food' && foodLogs.count >= reqCount) {
            qualified = true;
          }
        }

        if (qualified) {
          const awarded = await Achievement.award(userId, ach.id);
          if (awarded) {
            newlyEarned.push(ach);
          }
        }
      }
    } catch (err) {
      logger.error('Error checking achievements', { userId, error: err.message });
    }

    return newlyEarned;
  }
};

module.exports = Achievement;
