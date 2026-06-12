const { listEmployees, listLeaves, listPayrolls, listRecruitmentBundle } = require('./hrStore');
const { listNotifications } = require('./notificationService');

function includesQuery(value, query) {
  return String(value || '').toLowerCase().includes(query);
}

async function searchEverything(term) {
  const query = String(term || '').trim().toLowerCase();
  if (!query) {
    return { employees: [], leaves: [], payrolls: [], recruitment: [], notifications: [], contractors: [] };
  }

  const [employees, leaves, payrolls, recruitment, notifications] = await Promise.all([
    listEmployees(),
    listLeaves(),
    listPayrolls(),
    listRecruitmentBundle(),
    listNotifications()
  ]);

  return {
    employees: employees.filter((item) => [item.name, item.role, item.department, item.email, item.employeeCode].some((value) => includesQuery(value, query))),
    leaves: leaves.filter((item) => [item.employeeId, item.employeeCode, item.leaveCode, item.type, item.status].some((value) => includesQuery(value, query))),
    payrolls: payrolls.filter((item) => [item.employeeId, item.employeeCode, item.payrollCode, item.month].some((value) => includesQuery(value, query))),
    recruitment: {
      jobs: recruitment.jobs.filter((item) => [item.title, item.department, item.status, item.jobCode].some((value) => includesQuery(value, query))),
      applications: recruitment.applications.filter((item) => [item.name, item.stage, item.applicationCode, item.jobCode].some((value) => includesQuery(value, query)))
    },
    notifications: notifications.filter((item) => [item.title, item.detail, item.message].some((value) => includesQuery(value, query))),
    contractors: []
  };
}

module.exports = { searchEverything };
