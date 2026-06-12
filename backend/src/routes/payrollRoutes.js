const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { payrollController } = require('../controllers/hrController');

const router = express.Router();

router.get('/', requireAuth, payrollController);

module.exports = router;
