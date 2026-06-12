require('dotenv').config();

const bcrypt = require('bcryptjs');
const { prisma } = require('../src/config/prisma');
const {
  employees,
  attendanceRecords,
  leaves,
  payrolls,
  jobs,
  applications,
  notifications,
  users
} = require('../src/data/seedData');

function stripIds(item) {
  const { id, _id, employeeId, jobId, ...record } = item;
  return {
    ...record,
    employeeCode: record.employeeCode || employeeId,
    jobCode: record.jobCode || jobId
  };
}

async function seed() {
  for (const employee of employees.map(stripIds)) {
    await prisma.employee.upsert({
      where: { employeeCode: employee.employeeCode },
      update: employee,
      create: employee
    });
  }

  for (const attendance of attendanceRecords.map(stripIds)) {
    await prisma.attendance.upsert({
      where: { attendanceCode: attendance.attendanceCode },
      update: attendance,
      create: attendance
    });
  }

  for (const leave of leaves.map(stripIds)) {
    await prisma.leave.upsert({
      where: { leaveCode: leave.leaveCode },
      update: leave,
      create: leave
    });
  }

  for (const payroll of payrolls.map(stripIds)) {
    await prisma.payroll.upsert({
      where: { payrollCode: payroll.payrollCode },
      update: payroll,
      create: payroll
    });
  }

  for (const job of jobs.map(stripIds)) {
    await prisma.recruitment.upsert({
      where: { jobCode: job.jobCode },
      update: job,
      create: job
    });
  }

  for (const application of applications.map(stripIds)) {
    await prisma.application.upsert({
      where: { applicationCode: application.applicationCode },
      update: application,
      create: application
    });
  }

  const employeeCodes = new Set((await prisma.employee.findMany({ select: { employeeCode: true } })).map((employee) => employee.employeeCode));
  for (const { id, ...notification } of notifications) {
    const data = {
      ...notification,
      message: notification.message || notification.detail || '',
      severity: notification.severity || 'low',
      read: Boolean(notification.read),
      employeeId: employeeCodes.has(notification.employeeId) ? notification.employeeId : null
    };

    await prisma.notification.upsert({
      where: { id },
      update: data,
      create: { id, ...data }
    });
  }

  for (const user of users) {
    const data = {
      name: user.name,
      email: user.email.toLowerCase(),
      password: await bcrypt.hash(user.password, 10),
      role: user.role
    };

    await prisma.user.upsert({
      where: { email: data.email },
      update: data,
      create: data
    });
  }
}

seed()
  .then(async () => {
    await prisma.$disconnect();
    console.log('PostgreSQL seed completed');
  })
  .catch(async (error) => {
    await prisma.$disconnect();
    console.error(error);
    process.exit(1);
  });
