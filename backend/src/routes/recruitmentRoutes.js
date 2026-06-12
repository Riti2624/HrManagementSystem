const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
	recruitmentController,
	createJobController,
	updateJobController,
	deleteJobController,
	createApplicationController,
	updateApplicationController,
	deleteApplicationController
} = require('../controllers/hrController');

const router = express.Router();

router.get('/', requireAuth, recruitmentController);
router.post('/jobs', requireAuth, createJobController);
router.put('/jobs/:id', requireAuth, updateJobController);
router.delete('/jobs/:id', requireAuth, deleteJobController);
router.post('/applications', requireAuth, createApplicationController);
router.put('/applications/:id', requireAuth, updateApplicationController);
router.delete('/applications/:id', requireAuth, deleteApplicationController);

module.exports = router;
