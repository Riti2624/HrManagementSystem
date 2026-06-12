export const mockEmployees = [
  {
    id: 'emp-001',
    name: 'Aarav Mehta',
    role: 'Senior Frontend Engineer',
    department: 'Engineering',
    email: 'aarav@hrms.io',
    location: 'Bengaluru',
    status: 'Active',
    salary: 127800,
    performanceScore: 92,
    attendanceRate: 97,
    sentimentScore: 0.84,
    skills: ['React', 'Framer Motion', 'Design Systems', 'TypeScript'],
    workload: 78,
    attritionRisk: 'Low',
    leaveBalance: 9,
    performanceTrend: 'Rising'
  },
  {
    id: 'emp-002',
    name: 'Maya Iyer',
    role: 'Sales Lead',
    department: 'Sales',
    email: 'maya@hrms.io',
    location: 'Mumbai',
    status: 'Active',
    salary: 84700,
    performanceScore: 74,
    attendanceRate: 89,
    sentimentScore: 0.61,
    skills: ['Negotiation', 'Forecasting', 'CRM'],
    workload: 94,
    attritionRisk: 'High',
    leaveBalance: 8,
    performanceTrend: 'Stable'
  },
  {
    id: 'emp-003',
    name: 'Noah Khan',
    role: 'People Operations Specialist',
    department: 'HR',
    email: 'noah@hrms.io',
    location: 'Delhi',
    status: 'On Leave',
    salary: 86000,
    performanceScore: 86,
    attendanceRate: 95,
    sentimentScore: 0.72,
    skills: ['Policy', 'Employee Relations', 'Analytics'],
    workload: 66,
    attritionRisk: 'Low',
    leaveBalance: 10,
    performanceTrend: 'Rising'
  },
  {
    id: 'emp-004',
    name: 'Sara Gomez',
    role: 'Support Engineer',
    department: 'Support',
    email: 'sara@hrms.io',
    location: 'Remote',
    status: 'Active',
    salary: 82100,
    performanceScore: 68,
    attendanceRate: 83,
    sentimentScore: 0.49,
    skills: ['Customer Support', 'Troubleshooting'],
    workload: 97,
    attritionRisk: 'High',
    leaveBalance: 5,
    performanceTrend: 'Needs attention'
  },
  {
    id: 'emp-005',
    name: 'Dev Patel',
    role: 'Data Analyst',
    department: 'Analytics',
    email: 'dev@hrms.io',
    location: 'Pune',
    status: 'Active',
    salary: 82100,
    performanceScore: 88,
    attendanceRate: 91,
    sentimentScore: 0.79,
    skills: ['Power BI', 'SQL', 'Forecasting'],
    workload: 73,
    attritionRisk: 'Medium',
    leaveBalance: 11,
    performanceTrend: 'Rising'
  }
];

export const mockDashboard = {
  totalEmployees: 5,
  attendanceRate: 91,
  attritionRiskCount: 2,
  hiringPipeline: 4,
  departmentWorkload: [
    { department: 'Engineering', workload: 78 },
    { department: 'Sales', workload: 94 },
    { department: 'HR', workload: 66 },
    { department: 'Support', workload: 97 },
    { department: 'Analytics', workload: 73 }
  ],
  notifications: [
    { id: 'n1', type: 'alert', title: '3 employees at high attrition risk', detail: 'Support and Sales need immediate workload review.' },
    { id: 'n2', type: 'success', title: 'Leave approvals pending', detail: '2 requests require HR attention.' },
    { id: 'n3', type: 'info', title: 'Payroll sync completed', detail: 'June payroll data refreshed successfully.' }
  ],
  highRiskEmployees: ['Maya Iyer', 'Sara Gomez']
};

export const mockAttendance = {
  trend: [
    { day: 'Mon', rate: 89 },
    { day: 'Tue', rate: 92 },
    { day: 'Wed', rate: 88 },
    { day: 'Thu', rate: 94 },
    { day: 'Fri', rate: 90 }
  ],
  summary: { presentCount: 2, lateCount: 2, absentCount: 0 },
  records: [
    { id: 'a1', employeeId: 'emp-001', date: '2026-06-09', checkIn: '09:01', checkOut: '18:32', status: 'Present', geo: '12.9716,77.5946' },
    { id: 'a2', employeeId: 'emp-002', date: '2026-06-09', checkIn: '09:24', checkOut: '18:01', status: 'Late', geo: '19.0760,72.8777' },
    { id: 'a3', employeeId: 'emp-004', date: '2026-06-09', checkIn: '09:44', checkOut: '17:44', status: 'Late', geo: 'Remote' }
  ]
};

export const mockLeaves = {
  suggestions: [
    'Early next month is best for Engineering because workload dips after the release freeze.',
    'Avoid scheduling leave for Sales during the last week of the month due to forecast reviews.'
  ],
  requests: [
    { id: 'leave-001', employeeId: 'emp-003', type: 'Casual', from: '2026-06-10', to: '2026-06-12', reason: 'Family event', status: 'Approved', balanceAfter: 10 },
    { id: 'leave-002', employeeId: 'emp-002', type: 'Sick', from: '2026-06-11', to: '2026-06-11', reason: 'Fever', status: 'Pending', balanceAfter: 8 },
    { id: 'leave-003', employeeId: 'emp-004', type: 'Earned', from: '2026-06-18', to: '2026-06-20', reason: 'Travel', status: 'Rejected', balanceAfter: 5 }
  ]
};

export const mockPayroll = [
  { id: 'pay-001', employeeId: 'emp-001', month: 'June 2026', base: 120000, bonus: 12000, deductions: 4200, net: 127800, benchmark: 0.92, benchmarkLabel: 'Market aligned', raiseSuggestion: 'No raise required immediately' },
  { id: 'pay-002', employeeId: 'emp-002', month: 'June 2026', base: 82000, bonus: 6000, deductions: 3300, net: 84700, benchmark: 0.86, benchmarkLabel: 'Below market', raiseSuggestion: 'Recommend 8-12% raise band review' },
  { id: 'pay-003', employeeId: 'emp-005', month: 'June 2026', base: 78000, bonus: 7000, deductions: 2900, net: 82100, benchmark: 0.9, benchmarkLabel: 'Market aligned', raiseSuggestion: 'No raise required immediately' }
];

export const mockRecruitment = {
  jobs: [
    { id: 'job-001', title: 'Senior Backend Engineer', department: 'Engineering', status: 'Open', applicants: 18, priority: 'High' },
    { id: 'job-002', title: 'Support Associate', department: 'Support', status: 'Open', applicants: 31, priority: 'Medium' },
    { id: 'job-003', title: 'HR Generalist', department: 'HR', status: 'Closed', applicants: 24, priority: 'Low' }
  ],
  applications: [
    { id: 'app-001', jobId: 'job-001', name: 'Leena Shah', score: 91, stage: 'Shortlisted' },
    { id: 'app-002', jobId: 'job-001', name: 'Kabir S.', score: 84, stage: 'Interview' },
    { id: 'app-003', jobId: 'job-002', name: 'Tara J.', score: 76, stage: 'New' },
    { id: 'app-004', jobId: 'job-002', name: 'Imran Ali', score: 63, stage: 'Rejected' }
  ]
};

export const mockCopilotMessages = [
  {
    role: 'assistant' as const,
    text: 'Daily HR summary: 2 employees are at high attrition risk, Sales is overloaded, and one leave approval is still pending.'
  },
  {
    role: 'assistant' as const,
    text: 'Suggested actions: adjust support coverage, review salary bands for Sales, and approve the pending HR leave request.'
  }
];
