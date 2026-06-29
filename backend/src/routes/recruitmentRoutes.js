const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  recruitmentController,
  createJobController,
  updateJobController,
  deleteJobController,
  createApplicationController,
  updateApplicationController,
  deleteApplicationController,
  // ATS
  listInterviewsController,
  createInterviewController,
  updateInterviewController,
  deleteInterviewController,
  getFeedbackController,
  createFeedbackController,
  updateFeedbackController,
  screenApplicationController,
  rankedCandidatesController,
  funnelAnalyticsController,
  convertToEmployeeController
} = require('../controllers/hrController');

const router = express.Router();

// Base recruitment data
router.get('/', requireAuth, recruitmentController);

// Jobs
router.post('/jobs', requireAuth, createJobController);
router.put('/jobs/:id', requireAuth, updateJobController);
router.delete('/jobs/:id', requireAuth, deleteJobController);

// Applications
router.post('/applications', requireAuth, createApplicationController);
router.put('/applications/:id', requireAuth, updateApplicationController);
router.delete('/applications/:id', requireAuth, deleteApplicationController);

// ATS: AI Screening
router.post('/applications/:id/screen', requireAuth, screenApplicationController);

// ATS: Convert to Employee
router.post('/applications/:id/convert', requireAuth, convertToEmployeeController);

// ATS: Ranked candidates
router.get('/ranked', requireAuth, rankedCandidatesController);

// ATS: Funnel analytics
router.get('/funnel', requireAuth, funnelAnalyticsController);

// Interviews
router.get('/interviews', requireAuth, listInterviewsController);
router.post('/interviews', requireAuth, createInterviewController);
router.put('/interviews/:id', requireAuth, updateInterviewController);
router.delete('/interviews/:id', requireAuth, deleteInterviewController);

// Interview Feedback
router.get('/interviews/:id/feedback', requireAuth, getFeedbackController);
router.post('/interviews/:id/feedback', requireAuth, createFeedbackController);
router.put('/interviews/:id/feedback/:feedbackId', requireAuth, updateFeedbackController);

module.exports = router;
