/**
 * Auth routes definition
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRegister, validateLogin, validateGoal } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes (Rate-limited)
router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);

// Protected routes (Token authenticated)
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/goal', authenticateToken, validateGoal, authController.updateGoal);

module.exports = router;
