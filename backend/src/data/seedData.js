const employees = [
  {
    employeeCode: 'emp-001',
    name: 'Aarav Mehta',
    role: 'Senior Frontend Engineer',
    department: 'Engineering',
    email: 'aarav@hrms.io',
    phone: '+1 415 555 0101',
    location: 'Bengaluru',
    status: 'Active',
    salary: 145000,
    performanceScore: 92,
    attendanceRate: 97,
    sentimentScore: 0.84,
    skills: ['React', 'Framer Motion', 'Design Systems', 'TypeScript'],
    workload: 0.78,
    attritionRisk: 'Low'
  },
  {
    employeeCode: 'emp-002',
    name: 'Maya Iyer',
    role: 'Sales Lead',
    department: 'Sales',
    email: 'maya@hrms.io',
    phone: '+1 415 555 0102',
    location: 'Mumbai',
    status: 'Active',
    salary: 98000,
    performanceScore: 74,
    attendanceRate: 89,
    sentimentScore: 0.61,
    skills: ['Negotiation', 'Forecasting', 'CRM'],
    workload: 0.94,
    attritionRisk: 'High'
  },
  {
    employeeCode: 'emp-003',
    name: 'Noah Khan',
    role: 'People Operations Specialist',
    department: 'HR',
    email: 'noah@hrms.io',
    phone: '+1 415 555 0103',
    location: 'Delhi',
    status: 'On Leave',
    salary: 86000,
    performanceScore: 86,
    attendanceRate: 95,
    sentimentScore: 0.72,
    skills: ['Policy', 'Employee Relations', 'Analytics'],
    workload: 0.66,
    attritionRisk: 'Low'
  },
  {
    employeeCode: 'emp-004',
    name: 'Sara Gomez',
    role: 'Support Engineer',
    department: 'Support',
    email: 'sara@hrms.io',
    phone: '+1 415 555 0104',
    location: 'Remote',
    status: 'Active',
    salary: 72000,
    performanceScore: 68,
    attendanceRate: 83,
    sentimentScore: 0.49,
    skills: ['Customer Support', 'Troubleshooting'],
    workload: 0.97,
    attritionRisk: 'High'
  },
  {
    employeeCode: 'emp-005',
    name: 'Dev Patel',
    role: 'Data Analyst',
    department: 'Analytics',
    email: 'dev@hrms.io',
    phone: '+1 415 555 0105',
    location: 'Pune',
    status: 'Active',
    salary: 94000,
    performanceScore: 88,
    attendanceRate: 91,
    sentimentScore: 0.79,
    skills: ['Power BI', 'SQL', 'Forecasting'],
    workload: 0.73,
    attritionRisk: 'Medium'
  }
];

const attendanceRecords = [
  { attendanceCode: 'attendance-001', employeeCode: 'emp-001', date: '2026-06-09', checkIn: '09:01', checkOut: '18:32', status: 'Present', geo: '12.9716,77.5946' },
  { attendanceCode: 'attendance-002', employeeCode: 'emp-002', date: '2026-06-09', checkIn: '09:24', checkOut: '18:01', status: 'Late', geo: '19.0760,72.8777' },
  { attendanceCode: 'attendance-003', employeeCode: 'emp-003', date: '2026-06-09', checkIn: '09:10', checkOut: null, status: 'On Leave', geo: '28.7041,77.1025' },
  { attendanceCode: 'attendance-004', employeeCode: 'emp-004', date: '2026-06-09', checkIn: '09:44', checkOut: '17:44', status: 'Late', geo: 'Remote' },
  { attendanceCode: 'attendance-005', employeeCode: 'emp-005', date: '2026-06-09', checkIn: '08:55', checkOut: '18:15', status: 'Present', geo: '18.5204,73.8567' }
];

const leaves = [
  { leaveCode: 'leave-001', employeeCode: 'emp-003', type: 'Casual', from: '2026-06-10', to: '2026-06-12', reason: 'Family event', status: 'Approved', balanceAfter: 10 },
  { leaveCode: 'leave-002', employeeCode: 'emp-002', type: 'Sick', from: '2026-06-11', to: '2026-06-11', reason: 'Fever', status: 'Pending', balanceAfter: 8 },
  { leaveCode: 'leave-003', employeeCode: 'emp-004', type: 'Earned', from: '2026-06-18', to: '2026-06-20', reason: 'Travel', status: 'Rejected', balanceAfter: 5 }
];

const payrolls = [
  { payrollCode: 'pay-001', employeeCode: 'emp-001', month: 'June 2026', base: 120000, bonus: 12000, deductions: 4200, net: 127800, benchmark: 0.92 },
  { payrollCode: 'pay-002', employeeCode: 'emp-002', month: 'June 2026', base: 82000, bonus: 6000, deductions: 3300, net: 84700, benchmark: 0.86 },
  { payrollCode: 'pay-003', employeeCode: 'emp-005', month: 'June 2026', base: 78000, bonus: 7000, deductions: 2900, net: 82100, benchmark: 0.9 }
];

const jobs = [
  { jobCode: 'job-001', title: 'Senior Backend Engineer', department: 'Engineering', status: 'Open', applicants: 18, priority: 'High' },
  { jobCode: 'job-002', title: 'Support Associate', department: 'Support', status: 'Open', applicants: 31, priority: 'Medium' },
  { jobCode: 'job-003', title: 'HR Generalist', department: 'HR', status: 'Closed', applicants: 24, priority: 'Low' }
];

const applications = [
  { applicationCode: 'app-001', jobCode: 'job-001', name: 'Leena Shah', score: 91, stage: 'Shortlisted' },
  { applicationCode: 'app-002', jobCode: 'job-001', name: 'Kabir S.', score: 84, stage: 'Interview' },
  { applicationCode: 'app-003', jobCode: 'job-002', name: 'Tara J.', score: 76, stage: 'New' },
  { applicationCode: 'app-004', jobCode: 'job-002', name: 'Imran Ali', score: 63, stage: 'Rejected' }
];

const notifications = [
  { id: 'notification-001', type: 'alert', title: '3 employees at high attrition risk', detail: 'Support and Sales need immediate workload review.' },
  { id: 'notification-002', type: 'success', title: 'Leave approvals pending', detail: '2 requests require HR attention.' },
  { id: 'notification-003', type: 'info', title: 'Payroll sync completed', detail: 'June payroll data refreshed successfully.' }
];

const users = [
  {
    id: 'user-001',
    name: 'Priya HR',
    email: 'hr@hrms.io',
    password: 'Password123!',
    role: 'Admin'
  },
  {
    id: 'user-002',
    name: 'Jordan Employee',
    email: 'employee@hrms.io',
    password: 'Password123!',
    role: 'Employee'
  }
];

module.exports = {
  employees,
  attendanceRecords,
  leaves,
  payrolls,
  jobs,
  applications,
  notifications,
  users
};
