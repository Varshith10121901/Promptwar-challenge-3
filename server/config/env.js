/**
 * Environment variables validation
 */
require('dotenv').config();

const requiredEnv = ['JWT_SECRET'];

for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.error(`Error: Environment variable ${env} is required but missing.`);
    process.exit(1);
  }
}

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_FILE: process.env.DATABASE_FILE || './database.sqlite',
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '300', 10)
};
