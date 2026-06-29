const employees = [
  {
    employeeCode: 'emp-001',
    name: 'Alice Admin',
    role: 'HR Director',
    department: 'HR',
    email: 'admin@hrms.demo',
    phone: '+1 415 555 0101',
    location: 'New York',
    status: 'Active',
    salary: 160000,
    performanceScore: 95,
    attendanceRate: 98,
    sentimentScore: 0.90,
    skills: ['Leadership', 'HR Strategy', 'Compliance'],
    workload: 0.85,
    attritionRisk: 'Low'
  },
  {
    employeeCode: 'emp-002',
    name: 'Bob Manager',
    role: 'Engineering Manager',
    department: 'Engineering',
    email: 'manager@hrms.demo',
    phone: '+1 415 555 0102',
    location: 'San Francisco',
    status: 'Active',
    salary: 145000,
    performanceScore: 88,
    attendanceRate: 95,
    sentimentScore: 0.75,
    skills: ['Agile', 'Team Building', 'System Design'],
    workload: 0.92,
    attritionRisk: 'Medium'
  },
  {
    employeeCode: 'emp-003',
    name: 'Charlie Employee',
    role: 'Senior Developer',
    department: 'Engineering',
    email: 'employee@hrms.demo',
    phone: '+1 415 555 0103',
    location: 'Remote',
    status: 'Active',
    salary: 130000,
    performanceScore: 92,
    attendanceRate: 99,
    sentimentScore: 0.88,
    skills: ['React', 'Node.js', 'PostgreSQL'],
    workload: 0.70,
    attritionRisk: 'Low'
  },
  {
    employeeCode: 'emp-004',
    name: 'Diana Recruiter',
    role: 'Talent Acquisition',
    department: 'HR',
    email: 'hr@hrms.demo',
    phone: '+1 415 555 0104',
    location: 'Chicago',
    status: 'Active',
    salary: 95000,
    performanceScore: 85,
    attendanceRate: 94,
    sentimentScore: 0.82,
    skills: ['Sourcing', 'Interviewing', 'Negotiation'],
    workload: 0.88,
    attritionRisk: 'Low'
  },
  {
    employeeCode: 'emp-005',
    name: 'Evan Sales',
    role: 'Account Executive',
    department: 'Sales',
    email: 'sales@hrms.demo',
    phone: '+1 415 555 0105',
    location: 'Austin',
    status: 'On Leave',
    salary: 110000,
    performanceScore: 78,
    attendanceRate: 85,
    sentimentScore: 0.65,
    skills: ['B2B Sales', 'CRM', 'Closing'],
    workload: 0.95,
    attritionRisk: 'High'
  }
];

const attendanceRecords = [
  { attendanceCode: 'attendance-001', employeeCode: 'emp-001', date: '2026-06-23', checkIn: '08:45', checkOut: '17:30', status: 'Present', geo: '40.7128,-74.0060' },
  { attendanceCode: 'attendance-002', employeeCode: 'emp-002', date: '2026-06-23', checkIn: '09:10', checkOut: '18:15', status: 'Present', geo: '37.7749,-122.4194' },
  { attendanceCode: 'attendance-003', employeeCode: 'emp-003', date: '2026-06-23', checkIn: '08:55', checkOut: '17:05', status: 'Present', geo: 'Remote' },
  { attendanceCode: 'attendance-004', employeeCode: 'emp-004', date: '2026-06-23', checkIn: '09:30', checkOut: '18:00', status: 'Late', geo: '41.8781,-87.6298' },
  { attendanceCode: 'attendance-005', employeeCode: 'emp-005', date: '2026-06-23', checkIn: null, checkOut: null, status: 'On Leave', geo: '30.2672,-97.7431' }
];

const leaves = [
  { leaveCode: 'leave-001', employeeCode: 'emp-005', type: 'Sick', from: '2026-06-20', to: '2026-06-25', reason: 'Medical recovery', status: 'Approved', balanceAfter: 12 },
  { leaveCode: 'leave-002', employeeCode: 'emp-002', type: 'Casual', from: '2026-07-01', to: '2026-07-05', reason: 'Family vacation', status: 'Pending', balanceAfter: 8 },
  { leaveCode: 'leave-003', employeeCode: 'emp-003', type: 'Earned', from: '2026-08-10', to: '2026-08-14', reason: 'Conference', status: 'Approved', balanceAfter: 15 }
];

const payrolls = [
  { payrollCode: 'pay-001', employeeCode: 'emp-001', month: 'May 2026', base: 13333, bonus: 2000, deductions: 4500, net: 10833, benchmark: 0.95 },
  { payrollCode: 'pay-002', employeeCode: 'emp-002', month: 'May 2026', base: 12083, bonus: 1500, deductions: 3800, net: 9783, benchmark: 0.90 },
  { payrollCode: 'pay-003', employeeCode: 'emp-003', month: 'May 2026', base: 10833, bonus: 1000, deductions: 3200, net: 8633, benchmark: 0.92 }
];

const jobs = [
  { jobCode: 'job-001', title: 'Senior Backend Engineer', department: 'Engineering', status: 'Open', applicants: 12, priority: 'High', description: 'Looking for a senior Node.js expert.', location: 'Remote', salary: '$140k-$160k' },
  { jobCode: 'job-002', title: 'Product Marketing Manager', department: 'Marketing', status: 'Open', applicants: 25, priority: 'Medium', description: 'Drive our product marketing strategy.', location: 'New York', salary: '$110k-$130k' },
  { jobCode: 'job-003', title: 'Customer Success Lead', department: 'Support', status: 'Closed', applicants: 40, priority: 'Low', description: 'Lead our customer success team.', location: 'Chicago', salary: '$90k-$110k' }
];

const applications = [
  { applicationCode: 'app-001', jobCode: 'job-001', name: 'Frank Applicant', score: 95, stage: 'Interview', candidateId: null, resumeUrl: '', coverLetter: 'I am a backend expert.', aiScore: 92, aiSummary: 'Strong candidate with deep Node.js experience.' },
  { applicationCode: 'app-002', jobCode: 'job-001', name: 'Grace Hopper', score: 88, stage: 'Shortlisted', candidateId: null, resumeUrl: '', coverLetter: 'Passionate about scalable systems.', aiScore: 85, aiSummary: 'Good potential, needs to demonstrate leadership.' },
  { applicationCode: 'app-003', jobCode: 'job-002', name: 'Heidi Sales', score: 80, stage: 'New', candidateId: null, resumeUrl: '', coverLetter: 'Experienced in SaaS marketing.', aiScore: 78, aiSummary: 'Relevant background in SaaS.' },
  { applicationCode: 'app-004', jobCode: 'job-002', name: 'Ivan Marketer', score: 65, stage: 'Rejected', candidateId: null, resumeUrl: '', coverLetter: 'I like marketing.', aiScore: 50, aiSummary: 'Lacks required technical product marketing skills.' }
];

const notifications = [
  { id: 'notification-001', type: 'alert', title: 'High Attrition Risk Detected', detail: 'Evan Sales has a high attrition risk score based on recent sentiment.', severity: 'high', read: false },
  { id: 'notification-002', type: 'info', title: 'New Leave Request', detail: 'Bob Manager has requested Casual Leave for July.', severity: 'low', read: false },
  { id: 'notification-003', type: 'success', title: 'Payroll Processed', detail: 'May 2026 payroll has been successfully disbursed.', severity: 'low', read: true }
];

const users = [
  {
    id: 'user-001',
    name: 'Alice Admin',
    email: 'admin@hrms.demo',
    password: 'Password123!',
    role: 'Admin'
  },
  {
    id: 'user-002',
    name: 'Diana Recruiter',
    email: 'hr@hrms.demo',
    password: 'Password123!',
    role: 'HR'
  },
  {
    id: 'user-003',
    name: 'Bob Manager',
    email: 'manager@hrms.demo',
    password: 'Password123!',
    role: 'Manager'
  },
  {
    id: 'user-004',
    name: 'Charlie Employee',
    email: 'employee@hrms.demo',
    password: 'Password123!',
    role: 'Employee'
  },
  {
    id: 'user-005',
    name: 'Evan Sales',
    email: 'sales@hrms.demo',
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
