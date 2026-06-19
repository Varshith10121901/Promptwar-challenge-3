/**
 * Node-Cache wrapper service for caching frequent lookups
 */
const NodeCache = require('node-cache');
const env = require('../config/env');
const logger = require('../utils/logger');

// Initialize node-cache with default TTL from env
const cache = new NodeCache({ 
  stdTTL: env.CACHE_TTL,
  checkperiod: env.CACHE_TTL * 0.2,
  useClones: false
});

logger.info(`In-memory cache initialized. Default TTL: ${env.CACHE_TTL}s`);

module.exports = {
  /**
   * Get value from cache
   * @param {string} key 
   * @returns {any}
   */
  get: (key) => {
    if (env.NODE_ENV === 'test') {
      return null; // Disable caching during tests to ensure isolation
    }
    return cache.get(key);
  },

  /**
   * Set value in cache
   * @param {string} key 
   * @param {any} value 
   * @param {number} [ttl] Specific TTL in seconds 
   */
  set: (key, value, ttl) => {
    if (env.NODE_ENV === 'test') {
      return;
    }
    cache.set(key, value, ttl);
  },

  /**
   * Delete value from cache
   * @param {string} key 
   */
  del: (key) => {
    if (env.NODE_ENV === 'test') {
      return;
    }
    cache.del(key);
  },

  /**
   * Clear all cache entries
   */
  flush: () => {
    cache.flushAll();
  }
};
