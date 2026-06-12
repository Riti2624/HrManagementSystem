const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
	leaveController,
	createLeaveController,
	updateLeaveController,
	deleteLeaveController
} = require('../controllers/hrController');

const router = express.Router();

router.get('/', requireAuth, leaveController);
router.post('/', requireAuth, createLeaveController);
router.put('/:id', requireAuth, updateLeaveController);
router.delete('/:id', requireAuth, deleteLeaveController);

module.exports = router;
