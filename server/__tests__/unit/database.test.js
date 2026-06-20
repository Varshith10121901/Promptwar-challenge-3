/**
 * Unit tests for database config methods
 */
const db = require('../../config/database');

describe('Database Config Unit Tests', () => {
  test('query should reject on error', async () => {
    await expect(db.query('SELECT * FROM non_existing_table_xyz')).rejects.toThrow();
  });

  test('get should reject on error', async () => {
    await expect(db.get('SELECT * FROM non_existing_table_xyz')).rejects.toThrow();
  });

  test('run should reject on error', async () => {
    await expect(db.run('INSERT INTO non_existing_table_xyz VALUES (1)')).rejects.toThrow();
  });
});
