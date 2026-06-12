const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/prisma');
const { users: seedUserData } = require('../data/seedData');
const { isPostgresConnected } = require('../config/db');

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function validatePasswordStrength(password) {
  const value = String(password || '');
  return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
}

function signToken(user) {
  return jwt.sign(
    { id: user.id || user._id?.toString(), email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '12h' }
  );
}

async function seedUsers() {
  if (!isPostgresConnected()) {
    return;
  }

  const count = await prisma.user.count();
  if (count > 0) {
    return;
  }

  const hashedUsers = await Promise.all(
    seedUserData.map(async (user) => ({
      name: user.name,
      email: user.email.toLowerCase(),
      password: await bcrypt.hash(user.password, 10),
      role: user.role
    }))
  );

  await prisma.user.createMany({ data: hashedUsers, skipDuplicates: true });
}

async function signup({ name, email, password, role }) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  if (!name || !validateEmail(normalizedEmail) || !validatePasswordStrength(password)) {
    const error = new Error('Invalid signup payload');
    error.code = 'INVALID_SIGNUP';
    throw error;
  }

  if (isPostgresConnected()) {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      const error = new Error('Email already exists');
      error.code = 'DUPLICATE_EMAIL';
      throw error;
    }

    const user = await prisma.user.create({ data: {
      name: String(name).trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: ['Admin', 'HR', 'Employee', 'Contractor'].includes(role) ? role : 'Employee'
    } });

    return {
      token: signToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
  }

  const error = new Error('PostgreSQL is not connected');
  error.code = 'DB_UNAVAILABLE';
  throw error;
}

async function login(email, password) {
  const normalizedEmail = String(email || '').toLowerCase().trim();

  if (isPostgresConnected()) {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return null;
    }

    const ok = await bcrypt.compare(String(password || ''), user.password);
    if (!ok) {
      return null;
    }

    return {
      token: signToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  const user = seedUserData.find((item) => item.email.toLowerCase() === normalizedEmail && item.password === password);
  if (!user) {
    return null;
  }

  return {
    token: signToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

module.exports = {
  seedUsers,
  login,
  signup,
  validateEmail,
  validatePasswordStrength
};
