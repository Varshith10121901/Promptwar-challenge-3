/**
 * Insights Controller provides personalized AI insights and checks/clears caches
 */
const User = require('../models/User');
const FootprintEntry = require('../models/FootprintEntry');
const insightsEngine = require('../services/insightsEngine');
const cache = require('../services/cacheService');
const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/AppError');

/**
 * Retrieve carbon footprint insights for the authenticated user
 * Checks cache first, and if missed, generates fresh insights using the engine
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} JSON response containing carbon insights
 * @throws {NotFoundError} If the authenticated user does not exist in the database
 */
const getInsights = async (req, res, next) => {
  const userId = req.user.id;
  const cacheKey = `insights:${userId}`;

  try {
    // 1. Try to read from in-memory cache
    const cachedInsights = cache.get(cacheKey);
    if (cachedInsights) {
      return res.json({
        success: true,
        source: 'cache',
        data: cachedInsights
      });
    }

    // 2. Fetch data from DB
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const entries = await FootprintEntry.findAllByUser(userId);

    // 3. Generate insights using engine
    const insights = insightsEngine.generateInsights(entries, user);

    // 4. Save to cache
    cache.set(cacheKey, insights);

    logger.info('Generated fresh AI carbon insights', { userId });
    return res.json({
      success: true,
      source: 'live',
      data: insights
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInsights
};
