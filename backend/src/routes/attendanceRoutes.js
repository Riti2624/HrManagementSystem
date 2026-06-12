const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { attendanceController } = require('../controllers/hrController');

const router = express.Router();

router.get('/', requireAuth, attendanceController);

module.exports = router;
