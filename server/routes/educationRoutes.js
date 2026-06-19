/**
 * Education routes definition
 */
const express = require('express');
const router = express.Router();
const educationController = require('../controllers/educationController');
const { apiLimiter } = require('../middleware/rateLimiter');

router.get('/', apiLimiter, educationController.getResources);

module.exports = router;
