/**
 * SQLite Database Connection and Initialization
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const env = require('./env');
const logger = require('../utils/logger');

// Select database source (use memory for tests to run in isolation)
const dbPath = env.NODE_ENV === 'test' ? ':memory:' : path.resolve(env.DATABASE_FILE);

logger.info(`Initializing SQLite database. Mode: ${env.NODE_ENV}, Source: ${dbPath === ':memory:' ? 'In-Memory' : dbPath}`);

// Create database directory if it doesn't exist
if (dbPath !== ':memory:') {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Failed to connect to the database', { error: err.message });
    process.exit(1);
  }
});

// Promisify database methods for clean async/await usage
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        logger.error('DB Query Error', { sql, params, error: err.message });
        return reject(err);
      }
      resolve(rows);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        logger.error('DB Get Error', { sql, params, error: err.message });
        return reject(err);
      }
      resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        logger.error('DB Run Error', { sql, params, error: err.message });
        return reject(err);
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

/**
 * Run migrations to setup database schema
 */
const runMigrations = async () => {
  try {
    // Foreign key support
    await run('PRAGMA foreign_keys = ON;');

    // Users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        carbon_goal REAL DEFAULT 500.0,
        streak_days INTEGER DEFAULT 0,
        last_active_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Footprint entries table
    await run(`
      CREATE TABLE IF NOT EXISTS footprint_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('transport', 'energy', 'food', 'consumption')),
        sub_category TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        carbon_kg REAL NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Indexing for faster retrieval
    await run('CREATE INDEX IF NOT EXISTS idx_entries_user_date ON footprint_entries(user_id, date)');
    await run('CREATE INDEX IF NOT EXISTS idx_entries_category ON footprint_entries(category)');

    // Challenges table
    await run(`
      CREATE TABLE IF NOT EXISTS challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        target_reduction REAL NOT NULL,
        duration_days INTEGER NOT NULL,
        difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
        points INTEGER NOT NULL DEFAULT 0
      )
    `);

    // User challenges tracking
    await run(`
      CREATE TABLE IF NOT EXISTS user_challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        challenge_id INTEGER NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'failed')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
      )
    `);

    // Index user challenges
    await run('CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id, status)');

    // Achievements table
    await run(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        criteria TEXT NOT NULL, -- e.g., 'streak:7', 'category:transport:5', 'total_reduction:100'
        points INTEGER NOT NULL DEFAULT 0
      )
    `);

    // User earned achievements
    await run(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        user_id INTEGER NOT NULL,
        achievement_id INTEGER NOT NULL,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, achievement_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
      )
    `);

    // Seed default challenges if they don't exist
    const challengeCount = await get('SELECT COUNT(*) as count FROM challenges');
    if (challengeCount.count === 0) {
      await seedDefaultChallenges();
    }

    // Seed default achievements if they don't exist
    const achievementCount = await get('SELECT COUNT(*) as count FROM achievements');
    if (achievementCount.count === 0) {
      await seedDefaultAchievements();
    }

    logger.info('Database migrations completed successfully.');
  } catch (err) {
    logger.error('Database migration failed', { error: err.message });
    process.exit(1);
  }
};

const seedDefaultChallenges = async () => {
  const challenges = [
    ['Car-free Week', 'Commute via cycling, walking, or public transit for 7 days straight.', 'transport', 15.0, 7, 'medium', 100],
    ['Go Vegan for 3 Days', 'Eat only plant-based meals for 3 consecutive days.', 'food', 8.5, 3, 'easy', 50],
    ['Power Saver', 'Reduce home electricity usage by switching off idle electronics and using natural light.', 'energy', 12.0, 7, 'easy', 60],
    ['Zero Fashion Waste', 'Avoid buying new clothing items and repair or reuse existing ones for 30 days.', 'consumption', 25.0, 30, 'hard', 200],
    ['Public Transit Commuter', 'Take bus or train instead of driving for 5 trips.', 'transport', 20.0, 10, 'easy', 80]
  ];

  for (const c of challenges) {
    await run(
      'INSERT INTO challenges (title, description, category, target_reduction, duration_days, difficulty, points) VALUES (?, ?, ?, ?, ?, ?, ?)',
      c
    );
  }
  logger.info('Default challenges seeded.');
};

const seedDefaultAchievements = async () => {
  const achievements = [
    ['First Step', 'Log your first carbon entry.', 'first_entry', 'log:1', 10],
    ['Week of Commits', 'Maintain a 7-day logging streak.', 'streak_7', 'streak:7', 50],
    ['Green Commuter', 'Log 5 public transit or bike/walk transport entries.', 'green_commuter', 'category:transport:5', 30],
    ['Eco-Friendly Eater', 'Log 10 vegetarian or vegan meals.', 'eco_eater', 'category:food:10', 40],
    ['Carbon Cutback', 'Achieve a cumulative carbon reduction of 100 kg CO2e.', 'carbon_cutter', 'reduction:100', 100]
  ];

  for (const a of achievements) {
    await run(
      'INSERT INTO achievements (name, description, icon, criteria, points) VALUES (?, ?, ?, ?, ?)',
      a
    );
  }
  logger.info('Default achievements seeded.');
};

module.exports = {
  db,
  query,
  get,
  run,
  runMigrations
};
