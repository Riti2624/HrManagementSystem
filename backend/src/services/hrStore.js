const { v4: uuidv4 } = require('uuid');

const { prisma } = require('../config/prisma');
const {
  employees: seedEmployees,
  attendanceRecords: seedAttendanceRecords,
  leaves: seedLeaves,
  payrolls: seedPayrolls,
  jobs: seedJobs,
  applications: seedApplications
} = require('../data/seedData');
const { isFallbackEnabled, isPostgresConnected } = require('../config/db');

const memoryStore = {
  employees: seedEmployees.map((item) => ({ ...item })),
  attendance: seedAttendanceRecords.map((item) => ({ ...item })),
  leaves: seedLeaves.map((item) => ({ ...item })),
  payrolls: seedPayrolls.map((item) => ({ ...item })),
  jobs: seedJobs.map((item) => ({ ...item })),
  applications: seedApplications.map((item) => ({ ...item })),
  interviews: [],
  feedbacks: []
};

function isDatabaseReady() {
  return isPostgresConnected();
}

function useFallbackStore() {
  return isFallbackEnabled() && !isDatabaseReady();
}

function requireStorageMode() {
  if (!isDatabaseReady() && !useFallbackStore()) {
    throw new Error('PostgreSQL is not connected and USE_FALLBACK is disabled');
  }
}

function clone(record) {
  return JSON.parse(JSON.stringify(record));
}

function identifierFilter(id, codeField) {
  return { OR: [{ id }, { [codeField]: id }] };
}

function businessCode(prefix, suppliedCode) {
  return suppliedCode || `${prefix}-${uuidv4()}`;
}

function serializeAttendance(record) {
  return {
    id: String(record._id ?? record.id ?? record.attendanceCode),
    attendanceCode: record.attendanceCode,
    employeeCode: record.employeeCode,
    employeeId: record.employeeCode,
    date: record.date,
    checkIn: record.checkIn,
    checkOut: record.checkOut,
    status: record.status,
    geo: record.geo,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function serializePayroll(record) {
  return {
    id: String(record._id ?? record.id),
    payrollCode: record.payrollCode,
    employeeCode: record.employeeCode,
    employeeId: record.employeeCode,
    month: record.month,
    base: record.base,
    bonus: record.bonus,
    deductions: record.deductions,
    net: record.net,
    benchmark: record.benchmark,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function serializeEmployee(record) {
  return {
    id: String(record._id ?? record.id),
    employeeCode: record.employeeCode,
    name: record.name,
    role: record.role,
    department: record.department,
    email: record.email,
    phone: record.phone,
    location: record.location,
    status: record.status,
    salary: record.salary,
    performanceScore: record.performanceScore,
    attendanceRate: record.attendanceRate,
    sentimentScore: record.sentimentScore,
    skills: record.skills || [],
    workload: record.workload,
    attritionRisk: record.attritionRisk,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function serializeLeave(record) {
  return {
    id: String(record._id ?? record.id),
    leaveCode: record.leaveCode,
    employeeCode: record.employeeCode,
    employeeId: record.employeeCode,
    type: record.type,
    from: record.from,
    to: record.to,
    reason: record.reason,
    status: record.status,
    balanceAfter: record.balanceAfter,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function serializeJob(record) {
  return {
    id: String(record._id ?? record.id),
    jobCode: record.jobCode,
    title: record.title,
    department: record.department,
    status: record.status,
    applicants: record.applicants,
    priority: record.priority,
    description: record.description || '',
    requirements: record.requirements || '',
    location: record.location || '',
    salary: record.salary || '',
    closingDate: record.closingDate || null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function serializeApplication(record) {
  return {
    id: String(record._id ?? record.id),
    applicationCode: record.applicationCode,
    jobCode: record.jobCode,
    jobId: record.jobCode,
    name: record.name,
    score: record.score,
    stage: record.stage,
    candidateId: record.candidateId || null,
    resumeUrl: record.resumeUrl || '',
    coverLetter: record.coverLetter || '',
    aiScore: record.aiScore || 0,
    aiSummary: record.aiSummary || '',
    recruiterNotes: record.recruiterNotes || '',
    skills: record.candidate?.skills || record.skills || [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function serializeInterview(record) {
  return {
    id: String(record._id ?? record.id),
    interviewCode: record.interviewCode,
    applicationId: record.applicationId,
    roundType: record.roundType || 'HR',
    scheduledAt: record.scheduledAt,
    interviewers: record.interviewers || [],
    location: record.location || '',
    status: record.status || 'Scheduled',
    notes: record.notes || '',
    feedbacks: record.feedbacks || [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function serializeFeedback(record) {
  return {
    id: String(record._id ?? record.id),
    interviewId: record.interviewId,
    reviewerName: record.reviewerName || '',
    communication: Number(record.communication || 0),
    technical: Number(record.technical || 0),
    cultureFit: Number(record.cultureFit || 0),
    leadership: Number(record.leadership || 0),
    overallScore: Number(record.overallScore || 0),
    recommendation: record.recommendation || 'Hold',
    comments: record.comments || '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function serializeEmployeePayload(payload) {
  return {
    employeeCode: payload.employeeCode,
    name: payload.name,
    role: payload.role,
    department: payload.department,
    email: payload.email,
    phone: payload.phone || '',
    location: payload.location || '',
    status: payload.status || 'Active',
    salary: Number(payload.salary || 0),
    performanceScore: Number(payload.performanceScore || 0),
    attendanceRate: Number(payload.attendanceRate || 0),
    sentimentScore: Number(payload.sentimentScore || 0),
    skills: Array.isArray(payload.skills) ? payload.skills : String(payload.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean),
    workload: Number(payload.workload || 0),
    attritionRisk: payload.attritionRisk || 'Low'
  };
}

function serializeLeavePayload(payload) {
  return {
    leaveCode: payload.leaveCode,
    employeeCode: payload.employeeCode || payload.employeeId,
    type: payload.type,
    from: payload.from,
    to: payload.to,
    reason: payload.reason,
    status: payload.status || 'Pending',
    balanceAfter: Number(payload.balanceAfter ?? 0)
  };
}

function serializeAttendancePayload(payload) {
  return {
    attendanceCode: payload.attendanceCode,
    employeeCode: payload.employeeCode || payload.employeeId,
    date: payload.date,
    checkIn: payload.checkIn || null,
    checkOut: payload.checkOut || null,
    status: payload.status || 'Present',
    geo: payload.geo || ''
  };
}

function serializeJobPayload(payload) {
  return {
    jobCode: payload.jobCode,
    title: payload.title,
    department: payload.department,
    status: payload.status || 'Open',
    applicants: Number(payload.applicants || 0),
    priority: payload.priority || 'Medium',
    description: payload.description || '',
    requirements: payload.requirements || '',
    location: payload.location || '',
    salary: payload.salary || '',
    closingDate: payload.closingDate || null
  };
}

function serializeApplicationPayload(payload) {
  return {
    applicationCode: payload.applicationCode,
    jobCode: payload.jobCode || payload.jobId,
    name: payload.name,
    score: Number(payload.score || 0),
    stage: payload.stage || 'New',
    candidateId: payload.candidateId || null,
    resumeUrl: payload.resumeUrl || '',
    coverLetter: payload.coverLetter || '',
    aiScore: Number(payload.aiScore || 0),
    aiSummary: payload.aiSummary || '',
    recruiterNotes: payload.recruiterNotes || ''
  };
}

function serializeInterviewPayload(payload) {
  return {
    interviewCode: payload.interviewCode,
    applicationId: payload.applicationId,
    roundType: payload.roundType || 'HR',
    scheduledAt: payload.scheduledAt,
    interviewers: Array.isArray(payload.interviewers)
      ? payload.interviewers
      : String(payload.interviewers || '').split(',').map((s) => s.trim()).filter(Boolean),
    location: payload.location || '',
    status: payload.status || 'Scheduled',
    notes: payload.notes || ''
  };
}

function serializeFeedbackPayload(payload) {
  return {
    interviewId: payload.interviewId,
    reviewerName: payload.reviewerName || '',
    communication: Number(payload.communication || 0),
    technical: Number(payload.technical || 0),
    cultureFit: Number(payload.cultureFit || 0),
    leadership: Number(payload.leadership || 0),
    overallScore: Number(payload.overallScore || 0),
    recommendation: payload.recommendation || 'Hold',
    comments: payload.comments || ''
  };
}

function sanitizeUpdatePayload(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) => key !== '_id' && value !== undefined));
}

function normalizeSeedRecord(item) {
  const { id, _id, employeeId, jobId, ...record } = item;
  return {
    ...record,
    employeeCode: record.employeeCode || employeeId,
    jobCode: record.jobCode || jobId
  };
}

async function seedPostgresCollections() {
  if (!isDatabaseReady()) {
    return;
  }

  if (await prisma.employee.count() === 0) {
    await prisma.employee.createMany({ data: seedEmployees.map(normalizeSeedRecord), skipDuplicates: true });
  }

  if (await prisma.leave.count() === 0) {
    await prisma.leave.createMany({ data: seedLeaves.map(normalizeSeedRecord), skipDuplicates: true });
  }

  if (await prisma.attendance.count() === 0) {
    await prisma.attendance.createMany({ data: seedAttendanceRecords.map(normalizeSeedRecord), skipDuplicates: true });
  }

  if (await prisma.payroll.count() === 0) {
    await prisma.payroll.createMany({ data: seedPayrolls.map(normalizeSeedRecord), skipDuplicates: true });
  }

  if (await prisma.recruitment.count() === 0) {
    await prisma.recruitment.createMany({ data: seedJobs.map(normalizeSeedRecord), skipDuplicates: true });
  }

  if (await prisma.application.count() === 0) {
    await prisma.application.createMany({ data: seedApplications.map(normalizeSeedRecord), skipDuplicates: true });
  }
}

async function listEmployees() {
  if (isDatabaseReady()) {
    const records = await prisma.employee.findMany({ orderBy: { createdAt: 'desc' } });
    return records.map(serializeEmployee);
  }

  if (useFallbackStore()) {
    return clone(memoryStore.employees);
  }

  requireStorageMode();
}

async function getEmployee(id) {
  if (isDatabaseReady()) {
    const record = await prisma.employee.findFirst({ where: identifierFilter(id, 'employeeCode') });
    return record ? serializeEmployee(record) : null;
  }

  if (useFallbackStore()) {
    return clone(memoryStore.employees.find((item) => item.id === id) || null);
  }

  requireStorageMode();
}

async function createEmployee(payload) {
  if (isDatabaseReady()) {
    const record = await prisma.employee.create({ data: {
      ...serializeEmployeePayload(payload),
      employeeCode: businessCode('emp', payload.employeeCode)
    } });
    return serializeEmployee(record);
  }

  if (useFallbackStore()) {
    const item = { ...payload, id: payload.id || uuidv4() };
    memoryStore.employees.unshift(item);
    return clone(item);
  }

  requireStorageMode();
}

async function updateEmployee(id, payload) {
  if (isDatabaseReady()) {
    const updatePayload = sanitizeUpdatePayload(serializeEmployeePayload({ ...payload, id }));
    delete updatePayload._id;
    const existing = await prisma.employee.findFirst({ where: identifierFilter(id, 'employeeCode') });
    const record = existing ? await prisma.employee.update({ where: { id: existing.id }, data: updatePayload }) : null;
    return record ? serializeEmployee(record) : null;
  }

  if (!useFallbackStore()) {
    requireStorageMode();
  }

  const index = memoryStore.employees.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  memoryStore.employees[index] = { ...memoryStore.employees[index], ...payload, id };
  return clone(memoryStore.employees[index]);
}

async function deleteEmployee(id) {
  if (isDatabaseReady()) {
    const existing = await prisma.employee.findFirst({ where: identifierFilter(id, 'employeeCode') });
    if (!existing) {
      return false;
    }
    await prisma.employee.delete({ where: { id: existing.id } });
    return true;
  }

  if (!useFallbackStore()) {
    requireStorageMode();
  }

  const index = memoryStore.employees.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }

  memoryStore.employees.splice(index, 1);
  return true;
}

async function listLeaves() {
  if (isDatabaseReady()) {
    const records = await prisma.leave.findMany({ orderBy: { createdAt: 'desc' } });
    return records.map(serializeLeave);
  }

  if (useFallbackStore()) {
    return clone(memoryStore.leaves);
  }

  requireStorageMode();
}

async function createLeave(payload) {
  if (isDatabaseReady()) {
    const record = await prisma.leave.create({ data: {
      ...serializeLeavePayload(payload),
      leaveCode: businessCode('leave', payload.leaveCode)
    } });
    return serializeLeave(record);
  }

  if (useFallbackStore()) {
    const item = { ...payload, id: payload.id || uuidv4() };
    memoryStore.leaves.unshift(item);
    return clone(item);
  }

  requireStorageMode();
}

async function updateLeave(id, payload) {
  if (isDatabaseReady()) {
    const updatePayload = sanitizeUpdatePayload(serializeLeavePayload({ ...payload, id }));
    delete updatePayload._id;
    const existing = await prisma.leave.findFirst({ where: identifierFilter(id, 'leaveCode') });
    const record = existing ? await prisma.leave.update({ where: { id: existing.id }, data: updatePayload }) : null;
    return record ? serializeLeave(record) : null;
  }

  if (!useFallbackStore()) {
    requireStorageMode();
  }

  const index = memoryStore.leaves.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  memoryStore.leaves[index] = { ...memoryStore.leaves[index], ...payload, id };
  return clone(memoryStore.leaves[index]);
}

async function deleteLeave(id) {
  if (isDatabaseReady()) {
    const existing = await prisma.leave.findFirst({ where: identifierFilter(id, 'leaveCode') });
    if (!existing) {
      return false;
    }
    await prisma.leave.delete({ where: { id: existing.id } });
    return true;
  }

  if (!useFallbackStore()) {
    requireStorageMode();
  }

  const index = memoryStore.leaves.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }

  memoryStore.leaves.splice(index, 1);
  return true;
}

async function listJobs() {
  if (isDatabaseReady()) {
    const records = await prisma.recruitment.findMany({ orderBy: { createdAt: 'desc' } });
    return records.map(serializeJob);
  }

  if (useFallbackStore()) {
    return clone(memoryStore.jobs);
  }

  requireStorageMode();
}

async function createJob(payload) {
  let nextJobCode = payload.jobCode;

  if (isDatabaseReady()) {
    if (!nextJobCode) {
      const allJobs = await prisma.recruitment.findMany({ select: { jobCode: true } });
      let maxNum = 0;
      for (const j of allJobs) {
        if (j.jobCode && j.jobCode.startsWith('job-')) {
          const num = parseInt(j.jobCode.replace('job-', ''), 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
      nextJobCode = `job-${String(maxNum + 1).padStart(3, '0')}`;
    }

    const record = await prisma.recruitment.create({ data: {
      ...serializeJobPayload(payload),
      jobCode: nextJobCode
    } });
    return serializeJob(record);
  }

  if (useFallbackStore()) {
    if (!nextJobCode) {
      let maxNum = 0;
      for (const j of memoryStore.jobs) {
        if (j.jobCode && j.jobCode.startsWith('job-')) {
          const num = parseInt(j.jobCode.replace('job-', ''), 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
      nextJobCode = `job-${String(maxNum + 1).padStart(3, '0')}`;
    }

    const item = { ...payload, jobCode: nextJobCode, id: payload.id || uuidv4() };
    memoryStore.jobs.unshift(item);
    return clone(item);
  }

  requireStorageMode();
}

async function updateJob(id, payload) {
  if (isDatabaseReady()) {
    const updatePayload = sanitizeUpdatePayload(serializeJobPayload({ ...payload, id }));
    delete updatePayload._id;
    const existing = await prisma.recruitment.findFirst({ where: identifierFilter(id, 'jobCode') });
    const record = existing ? await prisma.recruitment.update({ where: { id: existing.id }, data: updatePayload }) : null;
    return record ? serializeJob(record) : null;
  }

  if (!useFallbackStore()) {
    requireStorageMode();
  }

  const index = memoryStore.jobs.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  memoryStore.jobs[index] = { ...memoryStore.jobs[index], ...payload, id };
  return clone(memoryStore.jobs[index]);
}

async function deleteJob(id) {
  if (isDatabaseReady()) {
    const existing = await prisma.recruitment.findFirst({ where: identifierFilter(id, 'jobCode') });
    if (!existing) {
      return false;
    }
    await prisma.recruitment.delete({ where: { id: existing.id } });
    return true;
  }

  if (!useFallbackStore()) {
    requireStorageMode();
  }

  const index = memoryStore.jobs.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }

  memoryStore.jobs.splice(index, 1);
  return true;
}

async function listApplications() {
  if (isDatabaseReady()) {
    const records = await prisma.application.findMany({ 
      orderBy: { createdAt: 'desc' },
      include: { candidate: { select: { skills: true } } }
    });
    return records.map(serializeApplication);
  }

  if (useFallbackStore()) {
    const { users } = require('../data/seedData');
    return memoryStore.applications.map((app) => {
      const candidate = users.find((u) => String(u.id) === String(app.candidateId));
      return serializeApplication({ ...app, candidate: { skills: candidate?.skills || [] } });
    });
  }

  requireStorageMode();
}

async function createApplication(payload) {
  if (isDatabaseReady()) {
    const record = await prisma.application.create({ data: {
      ...serializeApplicationPayload(payload),
      applicationCode: businessCode('app', payload.applicationCode)
    } });
    return serializeApplication(record);
  }

  if (useFallbackStore()) {
    const item = { ...payload, id: payload.id || uuidv4() };
    memoryStore.applications.unshift(item);
    return clone(item);
  }

  requireStorageMode();
}

async function updateApplication(id, payload) {
  if (isDatabaseReady()) {
    const existing = await prisma.application.findFirst({ where: identifierFilter(id, 'applicationCode') });
    if (!existing) return null;

    const mergedPayload = { ...existing, ...payload };
    const updatePayload = sanitizeUpdatePayload(serializeApplicationPayload(mergedPayload));
    
    // Remove fields that should not be updated directly or do not exist in the Prisma schema
    delete updatePayload._id;
    delete updatePayload.candidateId;

    const record = await prisma.application.update({ where: { id: existing.id }, data: updatePayload });
    return serializeApplication(record);
  }

  if (!useFallbackStore()) {
    requireStorageMode();
  }

  const index = memoryStore.applications.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  memoryStore.applications[index] = { ...memoryStore.applications[index], ...payload, id };
  return clone(memoryStore.applications[index]);
}

async function deleteApplication(id) {
  if (isDatabaseReady()) {
    const existing = await prisma.application.findFirst({ where: identifierFilter(id, 'applicationCode') });
    if (!existing) {
      return false;
    }
    await prisma.application.delete({ where: { id: existing.id } });
    return true;
  }

  if (!useFallbackStore()) {
    requireStorageMode();
  }

  const index = memoryStore.applications.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }

  memoryStore.applications.splice(index, 1);
  return true;
}

async function listRecruitmentBundle() {
  const [jobs, applications, interviews] = await Promise.all([listJobs(), listApplications(), listInterviews()]);
  return { jobs, applications, interviews };
}

// ── Interviews ────────────────────────────────────────────────────────────────

async function listInterviews() {
  if (isDatabaseReady()) {
    const records = await prisma.interview.findMany({
      orderBy: { createdAt: 'desc' },
      include: { feedbacks: true }
    });
    return records.map((r) => serializeInterview({ ...r, feedbacks: r.feedbacks.map(serializeFeedback) }));
  }
  if (useFallbackStore()) {
    return clone(memoryStore.interviews);
  }
  requireStorageMode();
}

async function createInterview(payload) {
  if (isDatabaseReady()) {
    const record = await prisma.interview.create({
      data: {
        ...serializeInterviewPayload(payload),
        interviewCode: businessCode('iv', payload.interviewCode)
      },
      include: { feedbacks: true }
    });
    return serializeInterview({ ...record, feedbacks: record.feedbacks.map(serializeFeedback) });
  }
  if (useFallbackStore()) {
    const item = { ...serializeInterviewPayload(payload), id: uuidv4(), interviewCode: businessCode('iv', payload.interviewCode), feedbacks: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    memoryStore.interviews.unshift(item);
    return clone(item);
  }
  requireStorageMode();
}

async function updateInterview(id, payload) {
  if (isDatabaseReady()) {
    const updatePayload = sanitizeUpdatePayload(serializeInterviewPayload({ ...payload, id }));
    delete updatePayload._id;
    delete updatePayload.interviewCode;
    const existing = await prisma.interview.findFirst({ where: identifierFilter(id, 'interviewCode') });
    const record = existing
      ? await prisma.interview.update({ where: { id: existing.id }, data: updatePayload, include: { feedbacks: true } })
      : null;
    return record ? serializeInterview({ ...record, feedbacks: record.feedbacks.map(serializeFeedback) }) : null;
  }
  if (!useFallbackStore()) requireStorageMode();
  const index = memoryStore.interviews.findIndex((item) => item.id === id || item.interviewCode === id);
  if (index === -1) return null;
  memoryStore.interviews[index] = { ...memoryStore.interviews[index], ...serializeInterviewPayload(payload), id };
  return clone(memoryStore.interviews[index]);
}

async function deleteInterview(id) {
  if (isDatabaseReady()) {
    const existing = await prisma.interview.findFirst({ where: identifierFilter(id, 'interviewCode') });
    if (!existing) return false;
    await prisma.interview.delete({ where: { id: existing.id } });
    return true;
  }
  if (!useFallbackStore()) requireStorageMode();
  const index = memoryStore.interviews.findIndex((item) => item.id === id || item.interviewCode === id);
  if (index === -1) return false;
  memoryStore.interviews.splice(index, 1);
  return true;
}

// ── Interview Feedback ────────────────────────────────────────────────────────

async function listFeedbackForInterview(interviewId) {
  if (isDatabaseReady()) {
    const records = await prisma.interviewFeedback.findMany({ where: { interviewId }, orderBy: { createdAt: 'desc' } });
    return records.map(serializeFeedback);
  }
  if (useFallbackStore()) {
    return clone(memoryStore.feedbacks.filter((f) => f.interviewId === interviewId));
  }
  requireStorageMode();
}

async function createFeedback(payload) {
  if (isDatabaseReady()) {
    const record = await prisma.interviewFeedback.create({ data: serializeFeedbackPayload(payload) });
    return serializeFeedback(record);
  }
  if (useFallbackStore()) {
    const item = { ...serializeFeedbackPayload(payload), id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    memoryStore.feedbacks.unshift(item);
    return clone(item);
  }
  requireStorageMode();
}

async function updateFeedback(id, payload) {
  if (isDatabaseReady()) {
    const existing = await prisma.interviewFeedback.findFirst({ where: { id } });
    const record = existing
      ? await prisma.interviewFeedback.update({ where: { id: existing.id }, data: sanitizeUpdatePayload(serializeFeedbackPayload(payload)) })
      : null;
    return record ? serializeFeedback(record) : null;
  }
  if (!useFallbackStore()) requireStorageMode();
  const index = memoryStore.feedbacks.findIndex((f) => f.id === id);
  if (index === -1) return null;
  memoryStore.feedbacks[index] = { ...memoryStore.feedbacks[index], ...serializeFeedbackPayload(payload), id };
  return clone(memoryStore.feedbacks[index]);
}

// ── Candidate-to-Employee Conversion ─────────────────────────────────────────

async function convertCandidateToEmployee(applicationId, extraPayload = {}) {
  // Fetch application
  let application = null;
  let candidate = null;

  if (isDatabaseReady()) {
    const appRecord = await prisma.application.findFirst({
      where: identifierFilter(applicationId, 'applicationCode'),
      include: { candidate: true, job: true }
    });
    if (!appRecord) throw new Error('Application not found');
    application = serializeApplication(appRecord);
    candidate = appRecord.candidate || null;

    // Build employee data
    const empCode = businessCode('emp', extraPayload.employeeCode);
    const employeeData = {
      employeeCode: empCode,
      name: extraPayload.name || candidate?.name || application.name,
      role: extraPayload.role || appRecord.job?.title || 'New Employee',
      department: extraPayload.department || appRecord.job?.department || 'General',
      email: extraPayload.email || candidate?.email || '',
      phone: extraPayload.phone || candidate?.phone || '',
      location: extraPayload.location || appRecord.job?.location || '',
      status: 'Active',
      salary: Number(extraPayload.salary || 0),
      performanceScore: 0,
      attendanceRate: 0,
      sentimentScore: 0,
      skills: extraPayload.skills || candidate?.skills || [],
      workload: 0,
      attritionRisk: 'Low'
    };

    const employee = await prisma.employee.create({ data: employeeData });
    await prisma.application.update({
      where: { id: appRecord.id },
      data: { stage: 'Hired' }
    });
    return { employee: serializeEmployee(employee), application: { ...application, stage: 'Hired' } };
  }

  if (useFallbackStore()) {
    const appRecord = memoryStore.applications.find((a) => a.id === applicationId || a.applicationCode === applicationId);
    if (!appRecord) throw new Error('Application not found');
    const job = memoryStore.jobs.find((j) => j.jobCode === appRecord.jobCode);
    const empCode = businessCode('emp', extraPayload.employeeCode);
    const newEmployee = {
      id: uuidv4(),
      employeeCode: empCode,
      name: extraPayload.name || appRecord.name,
      role: extraPayload.role || job?.title || 'New Employee',
      department: extraPayload.department || job?.department || 'General',
      email: extraPayload.email || '',
      phone: extraPayload.phone || '',
      location: extraPayload.location || '',
      status: 'Active',
      salary: Number(extraPayload.salary || 0),
      performanceScore: 0,
      attendanceRate: 0,
      sentimentScore: 0,
      skills: extraPayload.skills || [],
      workload: 0,
      attritionRisk: 'Low',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    memoryStore.employees.unshift(newEmployee);
    const appIndex = memoryStore.applications.findIndex((a) => a.id === applicationId || a.applicationCode === applicationId);
    if (appIndex !== -1) memoryStore.applications[appIndex].stage = 'Hired';
    return { employee: clone(newEmployee), application: { ...appRecord, stage: 'Hired' } };
  }

  requireStorageMode();
}

async function listAttendance() {
  if (isDatabaseReady()) {
    const records = await prisma.attendance.findMany({ orderBy: { createdAt: 'desc' } });
    return records.map(serializeAttendance);
  }

  if (useFallbackStore()) {
    return memoryStore.attendance.map(serializeAttendance);
  }

  requireStorageMode();
}

async function updateAttendance(id, payload) {
  if (isDatabaseReady()) {
    const updatePayload = sanitizeUpdatePayload(serializeAttendancePayload({ ...payload, id }));
    delete updatePayload._id;
    delete updatePayload.attendanceCode;
    const existing = await prisma.attendance.findFirst({ where: identifierFilter(id, 'attendanceCode') });
    const record = existing ? await prisma.attendance.update({ where: { id: existing.id }, data: updatePayload }) : null;
    return record ? serializeAttendance(record) : null;
  }

  if (!useFallbackStore()) {
    requireStorageMode();
  }

  const index = memoryStore.attendance.findIndex((item) => item.id === id || item.attendanceCode === id);
  if (index === -1) {
    return null;
  }

  memoryStore.attendance[index] = { ...memoryStore.attendance[index], ...serializeAttendancePayload(payload) };
  return serializeAttendance(memoryStore.attendance[index]);
}

async function deleteAttendance(id) {
  if (isDatabaseReady()) {
    const existing = await prisma.attendance.findFirst({ where: identifierFilter(id, 'attendanceCode') });
    if (!existing) {
      return false;
    }
    await prisma.attendance.delete({ where: { id: existing.id } });
    return true;
  }

  if (!useFallbackStore()) {
    requireStorageMode();
  }

  const index = memoryStore.attendance.findIndex((item) => item.id === id || item.attendanceCode === id);
  if (index === -1) {
    return false;
  }

  memoryStore.attendance.splice(index, 1);
  return true;
}

async function listPayrolls() {
  if (isDatabaseReady()) {
    const records = await prisma.payroll.findMany({ orderBy: { createdAt: 'desc' } });
    return records.map(serializePayroll);
  }

  if (useFallbackStore()) {
    return clone(memoryStore.payrolls);
  }

  requireStorageMode();
}

module.exports = {
  seedPostgresCollections,
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
  listJobs,
  createJob,
  updateJob,
  deleteJob,
  listApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  listRecruitmentBundle,
  listAttendance,
  updateAttendance,
  deleteAttendance,
  listPayrolls,
  listInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  listFeedbackForInterview,
  createFeedback,
  updateFeedback,
  convertCandidateToEmployee
};
