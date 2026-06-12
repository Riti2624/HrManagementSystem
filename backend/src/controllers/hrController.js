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
  listRecruitmentBundle
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

async function leaveController(_req, res, next) {
  try {
    const requests = await listLeaves();
    res.json({ suggestions: leaveSuggestions(), requests });
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
    notifyChange('dashboard:refresh', { reason: 'recruitment:updated' });
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
    notifyChange('dashboard:refresh', { reason: 'recruitment:updated' });
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

    notifyChange('dashboard:refresh', { reason: 'recruitment:updated' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function createApplicationController(req, res, next) {
  try {
    const application = await createApplication(req.body || {});
    await createNotification({ type: 'recruitment:updated', severity: 'low', title: 'Candidate added', detail: `${application.name} was added to the pipeline.` });
    notifyChange('dashboard:refresh', { reason: 'recruitment:updated' });
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
    notifyChange('dashboard:refresh', { reason: 'recruitment:updated' });
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

    notifyChange('dashboard:refresh', { reason: 'recruitment:updated' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
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
  copilotController
};
