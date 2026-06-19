/**
 * FootprintEntry model database operations
 */
const db = require('../config/database');

const FootprintEntry = {
  /**
   * Create a new carbon footprint entry
   * @returns {Promise<Object>}
   */
  create: async (userId, { category, subCategory, value, unit, carbonKg, date, notes }) => {
    const sql = `
      INSERT INTO footprint_entries (user_id, category, sub_category, value, unit, carbon_kg, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await db.run(sql, [
      userId,
      category,
      subCategory,
      Number(value),
      unit,
      Number(carbonKg),
      date,
      notes || null
    ]);
    return { id: result.id, userId, category, subCategory, value, unit, carbonKg, date, notes };
  },

  /**
   * Find entries for a user with pagination
   */
  findByUser: async (userId, limit = 50, offset = 0) => {
    const sql = `
      SELECT * FROM footprint_entries 
      WHERE user_id = ? 
      ORDER BY date DESC, id DESC 
      LIMIT ? OFFSET ?
    `;
    return db.query(sql, [userId, limit, offset]);
  },

  /**
   * Find all entries for a user (no limit, used for AI insights calculation)
   */
  findAllByUser: async (userId) => {
    const sql = `
      SELECT * FROM footprint_entries 
      WHERE user_id = ? 
      ORDER BY date ASC
    `;
    return db.query(sql, [userId]);
  },

  /**
   * Find a single entry by ID and verify owner
   */
  findByIdAndUser: async (id, userId) => {
    const sql = 'SELECT * FROM footprint_entries WHERE id = ? AND user_id = ?';
    return db.get(sql, [id, userId]);
  },

  /**
   * Delete an entry
   */
  delete: async (id, userId) => {
    const sql = 'DELETE FROM footprint_entries WHERE id = ? AND user_id = ?';
    const result = await db.run(sql, [id, userId]);
    return result.changes > 0;
  },

  /**
   * Aggregate carbon emissions by category in a date range
   */
  getCategorySummary: async (userId, startDate, endDate) => {
    const sql = `
      SELECT category, SUM(carbon_kg) as total_carbon_kg, COUNT(*) as entry_count 
      FROM footprint_entries 
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY category
    `;
    return db.query(sql, [userId, startDate, endDate]);
  },

  /**
   * Daily total carbon emissions for trend charts
   */
  getDailyTrends: async (userId, days = 30) => {
    const sql = `
      SELECT date, SUM(carbon_kg) as total_carbon_kg 
      FROM footprint_entries 
      WHERE user_id = ? AND date >= date('now', ?)
      GROUP BY date
      ORDER BY date ASC
    `;
    const offsetStr = `-${days} days`;
    return db.query(sql, [userId, offsetStr]);
  }
};

module.exports = FootprintEntry;
