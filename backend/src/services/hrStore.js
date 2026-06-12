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
  applications: seedApplications.map((item) => ({ ...item }))
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
    id: String(record._id ?? record.id),
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

function serializeJobPayload(payload) {
  return {
    jobCode: payload.jobCode,
    title: payload.title,
    department: payload.department,
    status: payload.status || 'Open',
    applicants: Number(payload.applicants || 0),
    priority: payload.priority || 'Medium'
  };
}

function serializeApplicationPayload(payload) {
  return {
    applicationCode: payload.applicationCode,
    jobCode: payload.jobCode || payload.jobId,
    name: payload.name,
    score: Number(payload.score || 0),
    stage: payload.stage || 'New'
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
  if (isDatabaseReady()) {
    const record = await prisma.recruitment.create({ data: {
      ...serializeJobPayload(payload),
      jobCode: businessCode('job', payload.jobCode)
    } });
    return serializeJob(record);
  }

  if (useFallbackStore()) {
    const item = { ...payload, id: payload.id || uuidv4() };
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
    const records = await prisma.application.findMany({ orderBy: { createdAt: 'desc' } });
    return records.map(serializeApplication);
  }

  if (useFallbackStore()) {
    return clone(memoryStore.applications);
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
    const updatePayload = sanitizeUpdatePayload(serializeApplicationPayload({ ...payload, id }));
    delete updatePayload._id;
    const existing = await prisma.application.findFirst({ where: identifierFilter(id, 'applicationCode') });
    const record = existing ? await prisma.application.update({ where: { id: existing.id }, data: updatePayload }) : null;
    return record ? serializeApplication(record) : null;
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
  const [jobs, applications] = await Promise.all([listJobs(), listApplications()]);
  return { jobs, applications };
}

async function listAttendance() {
  if (isDatabaseReady()) {
    const records = await prisma.attendance.findMany({ orderBy: { createdAt: 'desc' } });
    return records.map(serializeAttendance);
  }

  if (useFallbackStore()) {
    return clone(memoryStore.attendance);
  }

  requireStorageMode();
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
  listPayrolls
};
