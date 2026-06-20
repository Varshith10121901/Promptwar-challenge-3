/**
 * Auth Controller handles user registration, login, profile fetching, and token refresh.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const Challenge = require('../models/Challenge');
const logger = require('../utils/logger');
const HttpStatus = require('../utils/httpStatus');
const { NotFoundError, AuthenticationError } = require('../utils/AppError');

/**
 * Register a new user in the system
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} JSON response containing the registration token and user details
 */
const register = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(HttpStatus.CONFLICT).json({ success: false, message: 'Username is already taken' });
    }

    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(HttpStatus.CONFLICT).json({ success: false, message: 'Email is already registered' });
    }

    // 2. Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Save user to database
    const newUser = await User.create(username, email, passwordHash);
    logger.info('New user registered successfully', { userId: newUser.id, username });

    // 4. Generate token
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, env.JWT_SECRET, { expiresIn: '2h' });

    return res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Authenticate a user and return a JWT session token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} JSON response containing user details and JWT token
 * @throws {AuthenticationError} If username/email or password is invalid
 */
const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    // 1. Find user by username or email
    let user = null;
    if (username.includes('@')) {
      user = await User.findByEmail(username);
    } else {
      user = await User.findByUsername(username);
    }

    if (!user) {
      throw new AuthenticationError('Invalid username/email or password');
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AuthenticationError('Invalid username/email or password');
    }

    // 3. Update active date and streak
    await User.updateStreak(user.id);
    const updatedUser = await User.findById(user.id);

    logger.info('User logged in successfully', { userId: user.id, username: user.username });

    // 4. Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, env.JWT_SECRET, { expiresIn: '2h' });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        carbonGoal: updatedUser.carbon_goal,
        streakDays: updatedUser.streak_days
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch authenticated user profile data, including achievements and challenges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} JSON response with user profile details
 * @throws {NotFoundError} If user does not exist
 */
const getProfile = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Refresh streak and achievements
    const streakInfo = await User.updateStreak(userId);
    const newAchievements = await Achievement.checkAndAward(userId);
    
    // Fetch user details
    const finalUser = await User.findById(userId);
    const achievements = await Achievement.findUserAchievements(userId);
    const challenges = await Challenge.findUserChallenges(userId);

    return res.json({
      success: true,
      user: {
        id: finalUser.id,
        username: finalUser.username,
        email: finalUser.email,
        carbonGoal: finalUser.carbon_goal,
        streakDays: streakInfo.streakDays,
        lastActiveDate: streakInfo.lastActiveDate
      },
      achievements,
      challenges,
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update user's monthly carbon goal
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<Object>} JSON response with the updated goal
 * @throws {NotFoundError} If the user is not found
 */
const updateGoal = async (req, res, next) => {
  const userId = req.user.id;
  const { carbonGoal } = req.body;

  try {
    const success = await User.updateGoal(userId, carbonGoal);
    if (!success) {
      throw new NotFoundError('User not found or goal unchanged');
    }

    logger.info('User goal updated', { userId, carbonGoal });
    return res.json({
      success: true,
      message: 'Carbon goal updated successfully',
      carbonGoal
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Refresh expired/near-expired JWT tokens for authenticated users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response containing the refreshed token
 */
const refresh = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;

    const token = jwt.sign({ id: userId, username }, env.JWT_SECRET, { expiresIn: '2h' });

    logger.info('Token refreshed successfully', { userId });

    return res.json({
      success: true,
      token
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateGoal,
  refresh
};
