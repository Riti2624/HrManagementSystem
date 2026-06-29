const {
  enrichEmployees,
  calculateDashboard,
  attendanceInsights,
  leaveSuggestions,
  attritionAnalysis,
  payrollInsights,
  recruitmentInsights
} = require('../services/hrLogic');
const {
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
  createJob,
  updateJob,
  deleteJob,
  createApplication,
  updateApplication,
  deleteApplication,
  listRecruitmentBundle,
  updateAttendance,
  deleteAttendance,
  listInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  listFeedbackForInterview,
  createFeedback,
  updateFeedback,
  convertCandidateToEmployee
} = require('../services/hrStore');
const { generateCopilotResponse, generateDailySummary } = require('../services/aiService');
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification
} = require('../services/notificationService');
const { evaluateEmployeeAlerts, evaluateAttendanceAlerts } = require('../services/hrAlertEngine');
const { emitSocketEvent, emitDashboardRefresh } = require('../services/socketService');
const { searchEverything } = require('../services/searchService');
const { screenApplication, rankApplications, computeFunnelAnalytics } = require('../services/atsService');

function notifyChange(event, payload) {
  emitSocketEvent(event, payload);
  emitDashboardRefresh(event);
}

async function dashboardController(_req, res, next) {
  try {
    res.json(await calculateDashboard());
  } catch (error) {
    next(error);
  }
}

async function employeesController(_req, res, next) {
  try {
    res.json(await enrichEmployees());
  } catch (error) {
    next(error);
  }
}

async function employeeDetailController(req, res, next) {
  try {
    const employee = await getEmployee(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    return res.json(employee);
  } catch (error) {
    return next(error);
  }
}

async function createEmployeeController(req, res, next) {
  try {
    const employee = await createEmployee(req.body || {});
    await createNotification({
      type: 'employee:created',
      severity: employee.attritionRisk === 'High' ? 'high' : 'low',
      title: 'Employee created',
      detail: `${employee.name} was added to ${employee.department}.`,
      employeeId: employee.employeeCode
    });
    await evaluateEmployeeAlerts(employee);
    notifyChange('employee:created', employee);
    res.status(201).json(employee);
  } catch (error) {
    next(error);
  }
}

async function updateEmployeeController(req, res, next) {
  try {
    const previousEmployee = await getEmployee(req.params.id);
    const employee = await updateEmployee(req.params.id, req.body || {});

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await createNotification({
      type: 'employee:updated',
      severity: employee.attritionRisk === 'High' ? 'high' : 'low',
      title: 'Employee updated',
      detail: `${employee.name} profile updated.`,
      employeeId: employee.employeeCode
    });
    await evaluateEmployeeAlerts(employee, previousEmployee);
    notifyChange('employee:updated', employee);
    return res.json(employee);
  } catch (error) {
    return next(error);
  }
}

async function deleteEmployeeController(req, res, next) {
  try {
    const deleted = await deleteEmployee(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    notifyChange('employee:updated', { id: req.params.id, deleted: true });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function attendanceController(_req, res, next) {
  try {
    await evaluateAttendanceAlerts();
    const payload = await attendanceInsights();
    notifyChange('attendance:updated', { refreshed: true, updatedAt: new Date().toISOString() });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

async function updateAttendanceController(req, res, next) {
  try {
    const attendance = await updateAttendance(req.params.id, req.body || {});

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    await createNotification({
      type: 'attendance:updated',
      severity: attendance.status === 'Absent' ? 'medium' : 'low',
      title: 'Attendance updated',
      detail: `${attendance.employeeId} attendance was updated for ${attendance.date}.`,
      employeeId: attendance.employeeId
    });
    await evaluateAttendanceAlerts();
    notifyChange('attendance:updated', attendance);
    return res.json(attendance);
  } catch (error) {
    return next(error);
  }
}

async function deleteAttendanceController(req, res, next) {
  try {
    const deleted = await deleteAttendance(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    await evaluateAttendanceAlerts();
    notifyChange('attendance:updated', { id: req.params.id, deleted: true });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function leaveController(_req, res, next) {
  try {
    const requests = await listLeaves();
    res.json({ suggestions: await leaveSuggestions(), requests });
  } catch (error) {
    next(error);
  }
}

async function createLeaveController(req, res, next) {
  try {
    const leave = await createLeave(req.body || {});
    res.status(201).json(leave);
  } catch (error) {
    next(error);
  }
}

async function updateLeaveController(req, res, next) {
  try {
    const leave = await updateLeave(req.params.id, req.body || {});

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (['Approved', 'Rejected'].includes(leave.status)) {
      await createNotification({
        type: 'leave:updated',
        severity: leave.status === 'Rejected' ? 'medium' : 'low',
        title: `Leave ${leave.status.toLowerCase()}`,
        detail: `${leave.employeeCode || leave.employeeId} leave request was ${leave.status.toLowerCase()}.`,
        employeeId: leave.employeeCode || leave.employeeId
      });
    }
    notifyChange('leave:updated', leave);
    return res.json(leave);
  } catch (error) {
    return next(error);
  }
}

async function deleteLeaveController(req, res, next) {
  try {
    const deleted = await deleteLeave(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    notifyChange('leave:updated', { id: req.params.id, deleted: true });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function attritionController(_req, res, next) {
  try {
    res.json(await attritionAnalysis());
  } catch (error) {
    next(error);
  }
}

async function payrollController(_req, res, next) {
  try {
    const payload = await payrollInsights();
    notifyChange('payroll:updated', { refreshed: true, updatedAt: new Date().toISOString() });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

async function recruitmentController(_req, res, next) {
  try {
    res.json(await listRecruitmentBundle());
  } catch (error) {
    next(error);
  }
}

async function createJobController(req, res, next) {
  try {
    const job = await createJob(req.body || {});
    await createNotification({ type: 'recruitment:updated', severity: 'low', title: 'Job created', detail: `${job.title} was opened.` });
    notifyChange('recruitment:updated', job);
    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
}

async function updateJobController(req, res, next) {
  try {
    const job = await updateJob(req.params.id, req.body || {});

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await createNotification({ type: 'recruitment:updated', severity: 'low', title: 'Job updated', detail: `${job.title} was updated.` });
    notifyChange('recruitment:updated', job);
    return res.json(job);
  } catch (error) {
    return next(error);
  }
}

async function deleteJobController(req, res, next) {
  try {
    const deleted = await deleteJob(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Job not found' });
    }

    notifyChange('recruitment:updated', { id: req.params.id, deleted: true, entity: 'job' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function createApplicationController(req, res, next) {
  try {
    const application = await createApplication(req.body || {});
    await createNotification({ type: 'recruitment:updated', severity: 'low', title: 'Candidate added', detail: `${application.name} was added to the pipeline.` });
    notifyChange('recruitment:updated', application);
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
}

async function updateApplicationController(req, res, next) {
  try {
    const application = await updateApplication(req.params.id, req.body || {});

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    await createNotification({ type: 'recruitment:updated', severity: 'low', title: 'Candidate updated', detail: `${application.name} moved to ${application.stage}.` });
    notifyChange('recruitment:updated', application);
    return res.json(application);
  } catch (error) {
    return next(error);
  }
}

async function deleteApplicationController(req, res, next) {
  try {
    const deleted = await deleteApplication(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Application not found' });
    }

    notifyChange('recruitment:updated', { id: req.params.id, deleted: true, entity: 'application' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

// ── Interviews ─────────────────────────────────────────────────────────────────

async function listInterviewsController(_req, res, next) {
  try {
    res.json(await listInterviews());
  } catch (error) { next(error); }
}

async function createInterviewController(req, res, next) {
  try {
    const interview = await createInterview(req.body || {});
    await createNotification({ type: 'recruitment:updated', severity: 'low', title: 'Interview scheduled', detail: `${interview.roundType} interview scheduled for ${interview.scheduledAt}.` });
    notifyChange('recruitment:updated', interview);
    res.status(201).json(interview);
  } catch (error) { next(error); }
}

async function updateInterviewController(req, res, next) {
  try {
    const interview = await updateInterview(req.params.id, req.body || {});
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    notifyChange('recruitment:updated', interview);
    return res.json(interview);
  } catch (error) { return next(error); }
}

async function deleteInterviewController(req, res, next) {
  try {
    const deleted = await deleteInterview(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Interview not found' });
    notifyChange('recruitment:updated', { id: req.params.id, deleted: true, entity: 'interview' });
    return res.status(204).send();
  } catch (error) { return next(error); }
}

// ── Interview Feedback ──────────────────────────────────────────────────────────

async function getFeedbackController(req, res, next) {
  try {
    const feedback = await listFeedbackForInterview(req.params.id);
    res.json(feedback);
  } catch (error) { next(error); }
}

async function createFeedbackController(req, res, next) {
  try {
    const feedback = await createFeedback({ ...req.body, interviewId: req.params.id });
    notifyChange('recruitment:updated', feedback);
    res.status(201).json(feedback);
  } catch (error) { next(error); }
}

async function updateFeedbackController(req, res, next) {
  try {
    const feedback = await updateFeedback(req.params.feedbackId, req.body || {});
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    return res.json(feedback);
  } catch (error) { return next(error); }
}

// ── AI Screening ────────────────────────────────────────────────────────────────

async function screenApplicationController(req, res, next) {
  try {
    const { listApplications, listJobs } = require('../services/hrStore');
    const { prisma } = require('../config/prisma');
    const { isPostgresConnected } = require('../config/db');

    const [applications, jobs] = await Promise.all([listApplications(), listJobs()]);
    const application = applications.find((a) => a.id === req.params.id || a.applicationCode === req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const job = jobs.find((j) => j.jobCode === application.jobCode);

    // Try to get candidate user record for skills
    let candidate = null;
    if (application.candidateId) {
      if (isPostgresConnected()) {
        candidate = await prisma.user.findUnique({ where: { id: application.candidateId } });
      } else {
        const { users: seedUsers } = require('../data/seedData');
        candidate = seedUsers.find((u) => u.id === application.candidateId) || null;
      }
    }

    const result = await screenApplication({ application, job, candidate });

    // Persist the AI score back to the application
    const updated = await updateApplication(req.params.id, {
      ...application,
      aiScore: result.aiScore,
      aiSummary: result.aiSummary
    });

    notifyChange('recruitment:updated', updated || application);
    return res.json({ ...result, application: updated || application });
  } catch (error) { return next(error); }
}

// ── Ranked Candidates ──────────────────────────────────────────────────────────

async function rankedCandidatesController(req, res, next) {
  try {
    const { listApplications, listJobs } = require('../services/hrStore');
    const [applications, jobs] = await Promise.all([listApplications(), listJobs()]);
    const { jobCode } = req.query;
    const filtered = jobCode ? applications.filter((a) => a.jobCode === jobCode) : applications;
    const ranked = rankApplications(filtered);
    // Attach job info
    const enriched = ranked.map((app) => ({
      ...app,
      job: jobs.find((j) => j.jobCode === app.jobCode) || null
    }));
    return res.json(enriched);
  } catch (error) { return next(error); }
}

// ── Funnel Analytics ───────────────────────────────────────────────────────────

async function funnelAnalyticsController(req, res, next) {
  try {
    const { listApplications, listJobs } = require('../services/hrStore');
    const [applications, jobs] = await Promise.all([listApplications(), listJobs()]);
    const { jobCode } = req.query;
    const filtered = jobCode ? applications.filter((a) => a.jobCode === jobCode) : applications;
    return res.json(computeFunnelAnalytics(filtered, jobs));
  } catch (error) { return next(error); }
}

// ── Convert to Employee ─────────────────────────────────────────────────────────

async function convertToEmployeeController(req, res, next) {
  try {
    const result = await convertCandidateToEmployee(req.params.id, req.body || {});
    await createNotification({
      type: 'employee:created',
      severity: 'low',
      title: 'Candidate converted to employee',
      detail: `${result.employee.name} has been onboarded as ${result.employee.role}.`,
      employeeId: result.employee.employeeCode
    });
    notifyChange('employee:created', result.employee);
    notifyChange('recruitment:updated', result.application);
    return res.status(201).json(result);
  } catch (error) { return next(error); }
}

async function notificationsController(_req, res, next) {
  try {
    res.json(await listNotifications());
  } catch (error) {
    next(error);
  }
}

async function markNotificationReadController(req, res, next) {
  try {
    const notification = await markNotificationRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.json(notification);
  } catch (error) {
    return next(error);
  }
}

async function markAllNotificationsReadController(_req, res, next) {
  try {
    return res.json(await markAllNotificationsRead());
  } catch (error) {
    return next(error);
  }
}

async function dailySummaryController(_req, res, next) {
  try {
    return res.json(await generateDailySummary());
  } catch (error) {
    return next(error);
  }
}

async function searchController(req, res, next) {
  try {
    const { q = '' } = req.query || {};
    return res.json(await searchEverything(q));
  } catch (error) {
    return next(error);
  }
}

async function copilotController(req, res, next) {
  try {
    const { prompt = '' } = req.body || {};
    const response = await generateCopilotResponse(prompt);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  dashboardController,
  employeesController,
  employeeDetailController,
  createEmployeeController,
  updateEmployeeController,
  deleteEmployeeController,
  attendanceController,
  updateAttendanceController,
  deleteAttendanceController,
  leaveController,
  createLeaveController,
  updateLeaveController,
  deleteLeaveController,
  attritionController,
  payrollController,
  recruitmentController,
  createJobController,
  updateJobController,
  deleteJobController,
  createApplicationController,
  updateApplicationController,
  deleteApplicationController,
  notificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
  dailySummaryController,
  searchController,
  copilotController,
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
};
