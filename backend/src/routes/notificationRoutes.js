const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  notificationsController,
  markNotificationReadController,
  markAllNotificationsReadController
} = require('../controllers/hrController');

const router = express.Router();

router.get('/', requireAuth, notificationsController);
router.patch('/read-all', requireAuth, markAllNotificationsReadController);
router.patch('/:id/read', requireAuth, markNotificationReadController);

module.exports = router;
