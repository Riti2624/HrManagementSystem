const { listEmployees, listLeaves, listRecruitmentBundle, listAttendance, listPayrolls } = require('./hrStore');
const { listNotifications } = require('./notificationService');

function getLatestAttendanceTrend(records) {
  const byDate = records.reduce((accumulator, record) => {
    const date = record.date || 'Unknown';
    accumulator[date] = accumulator[date] || { present: 0, late: 0, absent: 0, total: 0 };
    accumulator[date].total += 1;
    if (record.status === 'Present') accumulator[date].present += 1;
    if (record.status === 'Late') accumulator[date].late += 1;
    if (record.status === 'Absent') accumulator[date].absent += 1;
    return accumulator;
  }, {});

  return Object.entries(byDate)
    .sort(([left], [right]) => String(left).localeCompare(String(right)))
    .slice(-5)
    .map(([day, counts]) => ({
      day,
      rate: counts.total ? Math.round(((counts.present + counts.late * 0.5) / counts.total) * 100) : 0
    }));
}

async function attendanceInsights() {
  const attendanceRecords = await listAttendance();
  const presentCount = attendanceRecords.filter((record) => record.status === 'Present').length;
  const lateCount = attendanceRecords.filter((record) => record.status === 'Late').length;
  const absentCount = attendanceRecords.filter((record) => record.status === 'Absent').length;

  return {
    trend: getLatestAttendanceTrend(attendanceRecords),
    summary: { presentCount, lateCount, absentCount },
    records: attendanceRecords
  };
}

async function enrichEmployees() {
  const [employees, leaves, attendanceRecords, payrollRecords] = await Promise.all([listEmployees(), listLeaves(), listAttendance(), listPayrolls()]);

  return employees.map((employee) => ({
    ...employee,
    leaveBalance: leaves.filter((leave) => leave.employeeCode === employee.employeeCode && leave.status !== 'Rejected').reduce((balance) => balance - 1, 12),
    attendance: attendanceRecords.filter((record) => record.employeeCode === employee.employeeCode),
    salary: payrollRecords.find((payroll) => payroll.employeeCode === employee.employeeCode)?.net ?? employee.salary,
    performanceTrend: employee.performanceScore >= 85 ? 'Rising' : employee.performanceScore >= 72 ? 'Stable' : 'Needs attention'
  }));
}

async function calculateDashboard() {
  const [employees, leaves, recruitment, attendanceRecords, payrollRecords] = await Promise.all([
    listEmployees(),
    listLeaves(),
    listRecruitmentBundle(),
    listAttendance(),
    listPayrolls()
  ]);
  const totalEmployees = employees.length;
  const attendanceRate = attendanceRecords.length
    ? Math.round(
        (attendanceRecords.filter((record) => record.status === 'Present').length + attendanceRecords.filter((record) => record.status === 'Late').length * 0.5) /
          attendanceRecords.length *
          100
      )
    : totalEmployees
      ? Math.round(employees.reduce((sum, employee) => sum + Number(employee.attendanceRate || 0), 0) / totalEmployees)
      : 0;
  const attritionRiskCount = employees.filter((employee) => employee.attritionRisk === 'High').length;
  const hiringPipeline = recruitment.applications.length;
  const departmentWorkload = Object.values(
    employees.reduce((accumulator, employee) => {
      accumulator[employee.department] = accumulator[employee.department] || { department: employee.department, workload: 0, count: 0 };
      accumulator[employee.department].workload += Number(employee.workload || 0);
      accumulator[employee.department].count += 1;
      return accumulator;
    }, {})
  ).map((item) => ({ department: item.department, workload: item.count ? Math.round((item.workload / item.count) * 100) : 0 }));

  return {
    totalEmployees,
    attendanceRate,
    attritionRiskCount,
    hiringPipeline,
    departmentWorkload,
    notifications: await listNotifications(),
    highRiskEmployees: employees
      .filter((employee) => employee.attritionRisk === 'High' || Number(employee.workload || 0) > 0.9 || Number(employee.sentimentScore || 0) < 0.6)
      .map((employee) => employee.name),
    openLeaveRequests: leaves.filter((item) => item.status === 'Pending').length
  };
}

function leaveSuggestions() {
  return [
    'Early next month is best for Engineering because workload dips after the release freeze.',
    'Avoid scheduling leave for Sales during the last week of the month due to forecast reviews.'
  ];
}

async function attritionAnalysis() {
  const employees = await listEmployees();

  return employees.map((employee) => {
    const attendancePenalty = Math.max(0, 100 - Number(employee.attendanceRate || 0)) * 0.35;
    const salaryPenalty = Number(employee.salary || 0) < 90000 ? 24 : 8;
    const sentimentPenalty = Math.max(0, 0.8 - Number(employee.sentimentScore || 0)) * 40;
    const performancePenalty = Math.max(0, 80 - Number(employee.performanceScore || 0)) * 0.45;
    const workloadPenalty = Number(employee.workload || 0) > 0.9 ? 18 : Number(employee.workload || 0) > 0.75 ? 10 : 4;
    const baseRiskScore = attendancePenalty + salaryPenalty + sentimentPenalty + performancePenalty + workloadPenalty;
    const riskScore = Math.min(100, Math.round(baseRiskScore + (employee.attritionRisk === 'High' ? 18 : employee.attritionRisk === 'Medium' ? 8 : 0)));
    const risk = riskScore >= 55 ? 'High' : riskScore >= 35 ? 'Medium' : 'Low';

    return {
      employeeId: employee.employeeCode,
      employeeCode: employee.employeeCode,
      name: employee.name,
      department: employee.department,
      risk,
      riskScore,
      reasons: [
        Number(employee.attendanceRate || 0) < 90 ? 'Attendance is slipping' : 'Attendance is healthy',
        Number(employee.salary || 0) < 90000 ? 'Salary below benchmark' : 'Compensation in range',
        Number(employee.workload || 0) > 0.9 ? 'Workload is excessive' : 'Workload is manageable'
      ],
      recommendation: risk === 'High' ? 'Schedule a retention review and adjust workload / compensation.' : risk === 'Medium' ? 'Check in with the manager and track sentiment weekly.' : 'Continue positive recognition.'
    };
  });
}

async function payrollInsights() {
  const payrollRecords = await listPayrolls();

  return payrollRecords.map((entry) => ({
    ...entry,
    benchmarkLabel: entry.benchmark >= 0.9 ? 'Market aligned' : 'Below market',
    raiseSuggestion: entry.benchmark < 0.9 ? 'Recommend 8-12% raise band review' : 'No raise required immediately'
  }));
}

async function recruitmentInsights() {
  const bundle = await listRecruitmentBundle();

  return {
    ...bundle,
    shortlist: bundle.applications.filter((application) => application.score >= 85),
    scores: bundle.applications.reduce((accumulator, application) => {
      accumulator[application.stage] = (accumulator[application.stage] || 0) + 1;
      return accumulator;
    }, {})
  };
}

async function notificationsFeed() {
  return listNotifications();
}

module.exports = {
  enrichEmployees,
  calculateDashboard,
  attendanceInsights,
  leaveSuggestions,
  attritionAnalysis,
  payrollInsights,
  recruitmentInsights,
  notificationsFeed
};
