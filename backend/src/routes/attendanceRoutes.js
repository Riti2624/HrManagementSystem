const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { attendanceController, updateAttendanceController, deleteAttendanceController } = require('../controllers/hrController');

const router = express.Router();

router.get('/', requireAuth, attendanceController);
router.put('/:id', requireAuth, requireRole('HR', 'Admin'), updateAttendanceController);
router.delete('/:id', requireAuth, requireRole('HR', 'Admin'), deleteAttendanceController);

module.exports = router;
