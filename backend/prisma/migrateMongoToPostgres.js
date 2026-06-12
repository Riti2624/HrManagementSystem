require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { prisma } = require('../src/config/prisma');
const Employee = require('../src/models/Employee');
const Attendance = require('../src/models/Attendance');
const Leave = require('../src/models/Leave');
const Payroll = require('../src/models/Payroll');
const Recruitment = require('../src/models/Recruitment');
const Application = require('../src/models/Application');
const Notification = require('../src/models/Notification');
const User = require('../src/models/User');
const { users: seedUsers } = require('../src/data/seedData');

function cleanRecord(record, aliases = {}) {
  const plain = record.toObject ? record.toObject() : record;
  const { _id, __v, id, ...data } = plain;

  for (const [legacyField, currentField] of Object.entries(aliases)) {
    if (!data[currentField] && data[legacyField]) {
      data[currentField] = data[legacyField];
    }
    delete data[legacyField];
  }

  return data;
}

async function upsertByCode(model, codeField, records, aliases = {}) {
  for (const record of records) {
    const data = cleanRecord(record, aliases);
    if (!data[codeField]) {
      data[codeField] = String(record._id);
    }

    await model.upsert({
      where: { [codeField]: data[codeField] },
      update: data,
      create: data
    });
  }
}

async function migrate() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required for MongoDB migration');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    autoIndex: false,
    serverSelectionTimeoutMS: 10000
  });

  await prisma.$connect();

  await upsertByCode(prisma.employee, 'employeeCode', await Employee.find());
  await upsertByCode(prisma.attendance, 'attendanceCode', await Attendance.find(), { employeeId: 'employeeCode' });
  await upsertByCode(prisma.leave, 'leaveCode', await Leave.find(), { employeeId: 'employeeCode' });
  await upsertByCode(prisma.payroll, 'payrollCode', await Payroll.find(), { employeeId: 'employeeCode' });
  await upsertByCode(prisma.recruitment, 'jobCode', await Recruitment.find());
  await upsertByCode(prisma.application, 'applicationCode', await Application.find(), { jobId: 'jobCode' });

  const employeeCodes = new Set((await prisma.employee.findMany({ select: { employeeCode: true } })).map((employee) => employee.employeeCode));
  const notifications = await Notification.find();
  for (const notification of notifications) {
    const data = cleanRecord(notification);
    data.type = data.type || 'info';
    data.severity = data.severity || 'low';
    data.detail = data.detail || data.message || '';
    data.message = data.message || data.detail || '';
    data.read = Boolean(data.read);
    data.employeeId = employeeCodes.has(data.employeeId) ? data.employeeId : null;

    await prisma.notification.upsert({
      where: { id: String(notification._id) },
      update: data,
      create: { id: String(notification._id), ...data }
    });
  }

  const users = await User.find();
  if (users.length) {
    for (const user of users) {
      const data = cleanRecord(user);
      data.email = String(data.email || '').toLowerCase();

      await prisma.user.upsert({
        where: { email: data.email },
        update: data,
        create: data
      });
    }
  } else {
    for (const user of seedUsers) {
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
}

migrate()
  .then(async () => {
    await mongoose.disconnect();
    await prisma.$disconnect();
    console.log('MongoDB to PostgreSQL migration completed');
  })
  .catch(async (error) => {
    await mongoose.disconnect().catch(() => {});
    await prisma.$disconnect().catch(() => {});
    console.error(error);
    process.exit(1);
  });
