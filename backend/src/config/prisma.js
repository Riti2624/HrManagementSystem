const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const globalForPrisma = global;
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/hrms_management?schema=public';
const adapter = new PrismaPg({ connectionString });

const prisma = globalForPrisma.__hrmsPrisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__hrmsPrisma = prisma;
}

module.exports = { prisma };
