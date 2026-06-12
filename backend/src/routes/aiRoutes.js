const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { copilotController, dailySummaryController } = require('../controllers/hrController');

const router = express.Router();

router.post('/copilot', requireAuth, copilotController);
router.get('/daily-summary', requireAuth, dailySummaryController);

module.exports = router;
