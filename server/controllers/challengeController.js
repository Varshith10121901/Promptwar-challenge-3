/**
 * Challenge Controller handles listing, enrolling, and completing challenges
 */
const Challenge = require('../models/Challenge');
const logger = require('../utils/logger');
const HttpStatus = require('../utils/httpStatus');
const { NotFoundError } = require('../utils/AppError');

/**
 * List all available challenges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} JSON response containing list of challenges
 */
const listChallenges = async (req, res, next) => {
  try {
    const challenges = await Challenge.listAll();
    return res.json({
      success: true,
      data: challenges
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve challenges enrolled or completed by the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} JSON response containing user challenges
 */
const getUserChallenges = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const challenges = await Challenge.findUserChallenges(userId);
    return res.json({
      success: true,
      data: challenges
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Enroll the authenticated user in a specific challenge
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} JSON response confirming enrollment
 * @throws {NotFoundError} If the challenge does not exist
 * @throws {ValidationError} If already enrolled or completed
 */
const enrollInChallenge = async (req, res, next) => {
  const userId = req.user.id;
  const { challengeId } = req.body;

  try {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      throw new NotFoundError('Challenge not found');
    }

    const enrollment = await Challenge.enroll(userId, challengeId);
    logger.info('User enrolled in challenge', { userId, challengeId });
    
    return res.status(HttpStatus.CREATED).json({
      success: true,
      message: `Enrolled in challenge: ${challenge.title}`,
      data: enrollment
    });
  } catch (err) {
    // Handle database constraint check or duplicate enrollment error
    if (err.message.includes('already enrolled') || err.message.includes('already completed')) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next(err);
  }
};

/**
 * Mark an enrolled challenge as completed for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} JSON response confirming completion and points awarded
 * @throws {NotFoundError} If the challenge does not exist
 * @throws {ValidationError} If not active or already completed
 */
const completeChallenge = async (req, res, next) => {
  const userId = req.user.id;
  const challengeId = req.params.id;

  try {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      throw new NotFoundError('Challenge not found');
    }

    const completed = await Challenge.complete(userId, challengeId);
    if (!completed) {
      return res.status(400).json({
        success: false,
        message: 'You are not active in this challenge or it is already completed'
      });
    }

    logger.info('User completed challenge', { userId, challengeId });
    return res.json({
      success: true,
      message: `Congratulations! You completed the challenge: ${challenge.title}`,
      pointsEarned: challenge.points
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listChallenges,
  getUserChallenges,
  enrollInChallenge,
  completeChallenge
};
