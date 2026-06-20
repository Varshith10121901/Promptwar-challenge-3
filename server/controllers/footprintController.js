/**
 * Footprint Controller handles carbon log CRUD, aggregates, trends, and calculator helpers
 */
const FootprintEntry = require('../models/FootprintEntry');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const calculator = require('../services/carbonCalculator');
const cache = require('../services/cacheService');
const logger = require('../utils/logger');
const HttpStatus = require('../utils/httpStatus');
const { NotFoundError } = require('../utils/AppError');

/**
 * Log a new carbon footprint activity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} JSON response containing logged activity details
 */
const createEntry = async (req, res, next) => {
  const userId = req.user.id;
  const { category, subCategory, value, unit, date, notes } = req.body;

  try {
    // 1. Calculate carbon emissions in kg
    const carbonKg = calculator.calculateEmissions(category, subCategory, value);
    const equivalents = calculator.getEquivalents(carbonKg);

    // 2. Save the footprint log
    const entry = await FootprintEntry.create(userId, {
      category,
      subCategory,
      value,
      unit,
      carbonKg,
      date,
      notes
    });

    // 3. Update logging streak
    const streakInfo = await User.updateStreak(userId);

    // 4. Scan for achievements unlocked by this entry
    const newAchievements = await Achievement.checkAndAward(userId);

    // 5. Invalidate insights cache for this user
    cache.del(`insights:${userId}`);

    logger.info('Carbon entry logged', { userId, entryId: entry.id, carbonKg });

    return res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Carbon activity logged successfully',
      data: {
        ...entry,
        carbonKg,
        equivalents
      },
      streakDays: streakInfo.streakDays,
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve a paginated list of carbon entries for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} JSON response containing the list of entries
 */
const getEntries = async (req, res, next) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '20', 10);
  const offset = (page - 1) * limit;

  try {
    const entries = await FootprintEntry.findByUser(userId, limit, offset);
    return res.json({
      success: true,
      page,
      limit,
      data: entries
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a specific carbon entry for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} JSON response confirming deletion
 * @throws {NotFoundError} If the entry is not found or user is unauthorized
 */
const deleteEntry = async (req, res, next) => {
  const userId = req.user.id;
  const entryId = req.params.id;

  try {
    const deleted = await FootprintEntry.delete(entryId, userId);
    if (!deleted) {
      throw new NotFoundError('Footprint entry not found or unauthorized');
    }

    // Invalidate insights cache for this user
    cache.del(`insights:${userId}`);

    logger.info('Carbon entry deleted', { userId, entryId });
    return res.json({
      success: true,
      message: 'Carbon entry deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get aggregated carbon summary and daily trends for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} JSON response containing totals, breakdown, and trends
 */
const getSummary = async (req, res, next) => {
  const userId = req.user.id;
  const days = parseInt(req.query.days || '30', 10);

  try {
    const endDate = new Date().toISOString().split('T')[0];
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startDate = start.toISOString().split('T')[0];

    const categoryBreakdown = await FootprintEntry.getCategorySummary(userId, startDate, endDate);
    const dailyTrends = await FootprintEntry.getDailyTrends(userId, days);

    // Calculate total emissions
    const totalEmissions = categoryBreakdown.reduce((sum, item) => sum + item.total_carbon_kg, 0);

    return res.json({
      success: true,
      totalEmissions: Math.round(totalEmissions * 100) / 100,
      breakdown: categoryBreakdown,
      trends: dailyTrends
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get lookup metadata for the carbon calculator (supported categories, factors, units)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing calculator options
 */
const getCalculatorMetadata = (req, res) => {
  const metadata = calculator.getMetadata();
  return res.json({
    success: true,
    data: metadata
  });
};

module.exports = {
  createEntry,
  getEntries,
  deleteEntry,
  getSummary,
  getCalculatorMetadata
};
