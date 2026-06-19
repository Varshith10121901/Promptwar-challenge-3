/**
 * AI Insights routes definition
 */
const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.get('/', authenticateToken, apiLimiter, insightsController.getInsights);

module.exports = router;
