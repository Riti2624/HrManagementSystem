const express = require('express');
const { loginController, meController, signupController } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginController);
router.post('/signup', signupController);
router.get('/me', requireAuth, meController);

module.exports = router;
