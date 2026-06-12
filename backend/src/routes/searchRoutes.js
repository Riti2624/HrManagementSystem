const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { searchController } = require('../controllers/hrController');

const router = express.Router();

router.get('/', requireAuth, searchController);

module.exports = router;
