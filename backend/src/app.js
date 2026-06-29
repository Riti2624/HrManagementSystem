const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const aiRoutes = require('./routes/aiRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const reportRoutes = require('./routes/reportRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const { requireAuth, requireRole } = require('./middleware/authMiddleware');
const { dashboardController } = require('./controllers/hrController');
const { getDatabaseHealth } = require('./config/db');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'hrms-backend' });
  });

  app.get('/health/db', (_req, res) => {
    res.json(getDatabaseHealth());
  });

  app.get('/dashboard', requireAuth, dashboardController);

  app.use('/auth', authRoutes);
  app.use('/employees', employeeRoutes);
  app.use('/attendance', attendanceRoutes);
  app.use('/leave', leaveRoutes);
  app.use('/payroll', payrollRoutes);
  app.use('/ai', aiRoutes);
  app.use('/recruitment', recruitmentRoutes);
  app.use('/notifications', notificationRoutes);
  app.use('/search', searchRoutes);
  app.use('/reports', reportRoutes);
  app.use('/candidate', requireAuth, requireRole('Candidate'), candidateRoutes);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
