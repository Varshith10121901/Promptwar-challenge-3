/**
 * Footprint routes definition
 */
const express = require('express');
const router = express.Router();
const footprintController = require('../controllers/footprintController');
const { authenticateToken } = require('../middleware/auth');
const { validateEntry } = require('../middleware/validate');
const { apiLimiter } = require('../middleware/rateLimiter');

// All footprint routes require authentication and share the API rate limiter
router.use(authenticateToken);
router.use(apiLimiter);

router.post('/', validateEntry, footprintController.createEntry);
router.get('/', footprintController.getEntries);
router.delete('/:id', footprintController.deleteEntry);
router.get('/summary', footprintController.getSummary);
router.get('/metadata', footprintController.getCalculatorMetadata);

module.exports = router;
