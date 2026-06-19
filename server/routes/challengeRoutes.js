/**
 * Challenge routes definition
 */
const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { authenticateToken } = require('../middleware/auth');
const { validateEnrollment } = require('../middleware/validate');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticateToken);
router.use(apiLimiter);

router.get('/', challengeController.listChallenges);
router.get('/user', challengeController.getUserChallenges);
router.post('/enroll', validateEnrollment, challengeController.enrollInChallenge);
router.post('/complete/:id', challengeController.completeChallenge);

module.exports = router;
