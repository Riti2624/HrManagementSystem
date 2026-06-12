const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { hrSummaryPdfController } = require('../controllers/reportController');

const router = express.Router();

router.get('/hr-summary/pdf', requireAuth, hrSummaryPdfController);

module.exports = router;
