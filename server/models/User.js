/**
 * User model database operations
 */
const db = require('../config/database');

const User = {
  /**
   * Create a new user
   * @param {string} username 
   * @param {string} email 
   * @param {string} passwordHash 
   * @returns {Promise<Object>} user record info
   */
  create: async (username, email, passwordHash) => {
    const sql = `
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `;
    const result = await db.run(sql, [username, email, passwordHash]);
    return { id: result.id, username, email };
  },

  /**
   * Find user by username
   * @param {string} username 
   * @returns {Promise<Object|null>}
   */
  findByUsername: async (username) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const user = await db.get(sql, [username]);
    return user || null;
  },

  /**
   * Find user by email
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  findByEmail: async (email) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const user = await db.get(sql, [email]);
    return user || null;
  },

  /**
   * Find user by ID
   * @param {number} id 
   * @returns {Promise<Object|null>}
   */
  findById: async (id) => {
    const sql = 'SELECT id, username, email, carbon_goal, streak_days, last_active_date, created_at FROM users WHERE id = ?';
    const user = await db.get(sql, [id]);
    return user || null;
  },

  /**
   * Update user's carbon goal
   * @param {number} id 
   * @param {number} goal 
   * @returns {Promise<boolean>}
   */
  updateGoal: async (id, goal) => {
    const sql = 'UPDATE users SET carbon_goal = ? WHERE id = ?';
    const result = await db.run(sql, [goal, id]);
    return result.changes > 0;
  },

  /**
   * Update logging streak days
   * @param {number} id 
   * @returns {Promise<Object>} updated streak info
   */
  updateStreak: async (id) => {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const lastActiveStr = user.last_active_date;
    
    let newStreak = user.streak_days || 0;

    if (!lastActiveStr) {
      newStreak = 1;
    } else {
      const today = new Date(todayStr);
      const lastActive = new Date(lastActiveStr);
      const diffTime = Math.abs(today - lastActive);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1; // streak broken, reset
      }
      // If diffDays === 0, same day logging, keep streak the same
    }

    const sql = 'UPDATE users SET streak_days = ?, last_active_date = ? WHERE id = ?';
    await db.run(sql, [newStreak, todayStr, id]);

    return { streakDays: newStreak, lastActiveDate: todayStr };
  }
};

module.exports = User;
