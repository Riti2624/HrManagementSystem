const { createNotification } = require('./notificationService');
const { emitSocketEvent } = require('./socketService');
const { listAttendance } = require('./hrStore');

const alertMemory = new Set();

function rememberAlert(key) {
  if (alertMemory.has(key)) {
    return false;
  }
  alertMemory.add(key);
  return true;
}

async function persistAlert(alert) {
  const key = `${alert.type}:${alert.employeeId || 'global'}:${alert.title}`;
  if (!rememberAlert(key)) {
    return null;
  }

  const notification = await createNotification({
    type: alert.type,
    severity: alert.severity,
    title: alert.title,
    detail: alert.message,
    message: alert.message,
    employeeId: alert.employeeId
  });

  emitSocketEvent('hr:alert:rule', alert);
  return notification;
}

async function evaluateEmployeeAlerts(employee, previousEmployee = null) {
  const alerts = [];
  const employeeId = employee.employeeCode || employee.employeeId || employee.id;

  if (employee.attritionRisk === 'High') {
    alerts.push({
      type: 'HR_ALERT',
      severity: 'high',
      title: `${employee.name} is at high attrition risk`,
      message: 'Attrition risk is marked High. Schedule a manager intervention and workload review.',
      employeeId
    });
  }

  if (previousEmployee && Number(previousEmployee.attendanceRate || 0) - Number(employee.attendanceRate || 0) >= 5) {
    alerts.push({
      type: 'HR_ALERT',
      severity: 'medium',
      title: `${employee.name} attendance dropped`,
      message: `Attendance rate dropped from ${previousEmployee.attendanceRate}% to ${employee.attendanceRate}%.`,
      employeeId
    });
  }

  if (previousEmployee && Number(previousEmployee.performanceScore || 0) - Number(employee.performanceScore || 0) >= 8) {
    alerts.push({
      type: 'HR_ALERT',
      severity: 'medium',
      title: `${employee.name} performance dropped`,
      message: `Performance score dropped from ${previousEmployee.performanceScore} to ${employee.performanceScore}.`,
      employeeId
    });
  }

  const notifications = [];
  for (const alert of alerts) {
    const notification = await persistAlert(alert);
    if (notification) {
      notifications.push(notification);
    }
  }

  return notifications;
}

async function evaluateAttendanceAlerts() {
  const attendance = await listAttendance();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const absenceCounts = attendance.reduce((accumulator, record) => {
    const recordDate = record.date ? new Date(record.date) : null;
    if (record.status !== 'Absent' || !recordDate || recordDate < sevenDaysAgo) {
      return accumulator;
    }

    const employeeId = record.employeeCode || record.employeeId;
    accumulator[employeeId] = (accumulator[employeeId] || 0) + 1;
    return accumulator;
  }, {});

  const notifications = [];
  for (const [employeeId, count] of Object.entries(absenceCounts)) {
    if (count > 3) {
      const notification = await persistAlert({
        type: 'HR_ALERT',
        severity: 'high',
        title: `${employeeId} has repeated absences`,
        message: `${count} absences were recorded in the last 7 days.`,
        employeeId
      });
      if (notification) {
        notifications.push(notification);
      }
    }
  }

  return notifications;
}

module.exports = {
  evaluateEmployeeAlerts,
  evaluateAttendanceAlerts
};
