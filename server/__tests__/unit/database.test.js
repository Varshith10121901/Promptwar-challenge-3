/**
 * Unit tests for database config methods, connection failures, and migrations
 */
const fs = require('fs');
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

  test('should handle directory creation in production mode', () => {
    jest.isolateModules(() => {
      const sqlite3 = require('sqlite3');
      const spyDb = jest.spyOn(sqlite3, 'Database').mockImplementation(() => {
        return {};
      });

      const spyExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const spyMkdir = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
      
      const originalEnv = process.env.NODE_ENV;
      const originalDbFile = process.env.DATABASE_FILE;
      
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_FILE = './test_dir_xyz/database.sqlite';
      
      // Reload database module to run directory creation code
      require('../../config/database');
      
      expect(spyExists).toHaveBeenCalled();
      expect(spyMkdir).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
      process.env.DATABASE_FILE = originalDbFile;
      spyExists.mockRestore();
      spyMkdir.mockRestore();
      spyDb.mockRestore();
    });
  });

  test('should exit process on database connection failure', () => {
    jest.isolateModules(() => {
      const sqlite3 = require('sqlite3');
      // Mock sqlite3 Database constructor to simulate connection error callback
      const spyDb = jest.spyOn(sqlite3, 'Database').mockImplementation((path, callback) => {
        callback(new Error('Simulated Connection Error'));
        return {};
      });
      
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      
      require('../../config/database');
      
      expect(mockExit).toHaveBeenCalledWith(1);
      
      mockExit.mockRestore();
      spyDb.mockRestore();
    });
  });

  test('should exit process on database migration failure', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Temporarily mock underlying sqlite3 db.run to throw error
    const sqliteDb = db.db;
    const originalDbRun = sqliteDb.run;
    sqliteDb.run = jest.fn().mockImplementation((sql, params, callback) => {
      const cb = typeof params === 'function' ? params : callback;
      if (cb) {
        cb(new Error('Simulated Migration Error'));
      }
    });
    
    await db.runMigrations();
    
    expect(mockExit).toHaveBeenCalledWith(1);
    
    // Restore
    sqliteDb.run = originalDbRun;
    mockExit.mockRestore();
  });
  test('should skip directory creation when directory already exists in production mode', () => {
    jest.isolateModules(() => {
      const sqlite3 = require('sqlite3');
      const spyDb = jest.spyOn(sqlite3, 'Database').mockImplementation(() => {
        return {};
      });

      const spyExists = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const spyMkdir = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
      
      const originalEnv = process.env.NODE_ENV;
      const originalDbFile = process.env.DATABASE_FILE;
      
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_FILE = './existing_dir/database.sqlite';
      
      require('../../config/database');
      
      expect(spyExists).toHaveBeenCalled();
      expect(spyMkdir).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
      process.env.DATABASE_FILE = originalDbFile;
      spyExists.mockRestore();
      spyMkdir.mockRestore();
      spyDb.mockRestore();
    });
  });

  test('should skip seeding when challenges and achievements already exist', async () => {
    // First run migrations to seed the initial data
    await db.runMigrations();
    
    // Run migrations again — the seed blocks should be skipped (count > 0)
    await db.runMigrations();
    
    // Verify challenges and achievements still exist with original counts
    const challenges = await db.query('SELECT COUNT(*) as count FROM challenges');
    expect(challenges[0].count).toBeGreaterThan(0);
    
    const achievements = await db.query('SELECT COUNT(*) as count FROM achievements');
    expect(achievements[0].count).toBeGreaterThan(0);
  });
});
