const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { prisma } = require('../config/prisma');
const { isPostgresConnected } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `resume-${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

// GET /candidate/profile
router.get('/profile', async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (isPostgresConnected()) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, phone: true, skills: true, resumeUrl: true }
      });
      if (!user) return res.status(404).json({ message: 'Candidate not found' });
      return res.json(user);
    } else {
      const { users: seedUsers } = require('../data/seedData');
      const user = seedUsers.find(u => u.id === userId);
      if (!user) return res.status(404).json({ message: 'Candidate not found' });
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        skills: user.skills || [],
        resumeUrl: user.resumeUrl || ''
      });
    }
  } catch (err) {
    next(err);
  }
});

// PUT /candidate/profile
router.put('/profile', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone, skills } = req.body || {};
    
    let normalizedSkills = [];
    if (Array.isArray(skills)) {
      normalizedSkills = skills;
    } else if (typeof skills === 'string') {
      normalizedSkills = skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (isPostgresConnected()) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          phone: phone || '',
          skills: normalizedSkills
        },
        select: { id: true, name: true, email: true, role: true, phone: true, skills: true, resumeUrl: true }
      });
      return res.json(updated);
    } else {
      const { users: seedUsers } = require('../data/seedData');
      const user = seedUsers.find(u => u.id === userId);
      if (!user) return res.status(404).json({ message: 'Candidate not found' });
      user.name = name || user.name;
      user.phone = phone || '';
      user.skills = normalizedSkills;
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        skills: user.skills,
        resumeUrl: user.resumeUrl || ''
      });
    }
  } catch (err) {
    next(err);
  }
});

// POST /candidate/upload-resume
router.post('/upload-resume', upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const userId = req.user.id;
    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    if (isPostgresConnected()) {
      await prisma.user.update({
        where: { id: userId },
        data: { resumeUrl }
      });
    } else {
      const { users: seedUsers } = require('../data/seedData');
      const user = seedUsers.find(u => u.id === userId);
      if (user) {
        user.resumeUrl = resumeUrl;
      }
    }

    return res.json({ resumeUrl });
  } catch (err) {
    next(err);
  }
});

// GET /candidate/jobs
router.get('/jobs', async (req, res, next) => {
  try {
    const { listJobs } = require('../services/hrStore');
    const allJobs = await listJobs();
    const activeJobs = allJobs.filter(job => job.status === 'Open');
    return res.json(activeJobs);
  } catch (err) {
    next(err);
  }
});

// GET /candidate/jobs/:id
router.get('/jobs/:id', async (req, res, next) => {
  try {
    const { listJobs } = require('../services/hrStore');
    const allJobs = await listJobs();
    const job = allJobs.find(j => j.id === req.params.id || j.jobCode === req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job opening not found' });
    }
    return res.json(job);
  } catch (err) {
    next(err);
  }
});

// POST /candidate/apply
router.post('/apply', async (req, res, next) => {
  try {
    const { jobCode, resumeUrl, coverLetter } = req.body || {};
    if (!jobCode) {
      return res.status(400).json({ message: 'jobCode is required' });
    }

    const { listJobs, updateJob, createApplication } = require('../services/hrStore');
    const allJobs = await listJobs();
    const job = allJobs.find(j => j.jobCode === jobCode);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user has already applied in local/postgres
    const { listApplications } = require('../services/hrStore');
    const allApps = await listApplications();
    const alreadyApplied = allApps.some(app => app.jobCode === jobCode && app.candidateId === req.user.id);
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this job.' });
    }

    const appCode = `app-${uuidv4().slice(0, 8)}`;
    const score = Math.floor(Math.random() * 35) + 65; // between 65 and 100

    const appPayload = {
      applicationCode: appCode,
      jobCode: job.jobCode,
      name: req.user.name,
      score,
      stage: 'New',
      candidateId: req.user.id,
      coverLetter: coverLetter || ''
    };

    const application = await createApplication(appPayload);

    // Save resumeUrl to profile if user uploaded a new one and doesn't have one
    if (resumeUrl) {
      if (isPostgresConnected()) {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (user && !user.resumeUrl) {
          await prisma.user.update({ where: { id: req.user.id }, data: { resumeUrl } });
        }
      } else {
        const { users: seedUsers } = require('../data/seedData');
        const user = seedUsers.find(u => u.id === req.user.id);
        if (user && !user.resumeUrl) {
          user.resumeUrl = resumeUrl;
        }
      }
    }

    // Increment applicants count
    await updateJob(job.id, {
      applicants: (job.applicants || 0) + 1
    });

    const { createNotification } = require('../services/notificationService');
    await createNotification({
      type: 'recruitment:updated',
      severity: 'low',
      title: 'New application received',
      detail: `${req.user.name} applied for ${job.title}.`,
    });

    const { emitSocketEvent, emitDashboardRefresh } = require('../services/socketService');
    emitSocketEvent('recruitment:updated', application);
    emitDashboardRefresh('recruitment:updated');

    return res.status(201).json(application);
  } catch (err) {
    next(err);
  }
});

// GET /candidate/applications
router.get('/applications', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { listApplications, listJobs } = require('../services/hrStore');
    const [applications, jobs] = await Promise.all([listApplications(), listJobs()]);
    
    const userApps = applications.filter(app => app.candidateId === userId);
    
    const userAppsWithJob = userApps.map(app => {
      const job = jobs.find(j => j.jobCode === app.jobCode);
      return {
        ...app,
        job: job || null
      };
    });

    return res.json(userAppsWithJob);
  } catch (err) {
    next(err);
  }
});

// GET /candidate/interviews - list all interviews for this candidate's applications
router.get('/interviews', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { listApplications, listInterviews, listJobs } = require('../services/hrStore');
    const [applications, interviews, jobs] = await Promise.all([listApplications(), listInterviews(), listJobs()]);
    const userApps = applications.filter(app => app.candidateId === userId);
    const userAppIds = new Set(userApps.map(a => a.id));

    const candidateInterviews = interviews
      .filter(iv => userAppIds.has(iv.applicationId))
      .map(iv => {
        const app = userApps.find(a => a.id === iv.applicationId);
        const job = jobs.find(j => j.jobCode === app?.jobCode);
        return { ...iv, application: app || null, job: job || null };
      });

    return res.json(candidateInterviews);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

