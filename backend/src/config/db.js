const { prisma } = require('./prisma');

let postgresConnected = false;

function getMongoStatus() {
  return postgresConnected ? 'connected' : 'disconnected';
}

function isFallbackEnabled() {
  return String(process.env.USE_FALLBACK || '').toLowerCase() === 'true';
}

function isMongoConnected() {
  return postgresConnected;
}

function isPostgresConnected() {
  return postgresConnected;
}

function getMongoHealth() {
  return getDatabaseHealth();
}

function getDatabaseHealth() {
  const postgresStatus = postgresConnected ? 'connected' : 'disconnected';
  return {
    mongoStatus: postgresStatus,
    postgresStatus,
    success: postgresConnected
  };
}

async function connectDatabase() {
  const uri = process.env.DATABASE_URL;
  const fallbackEnabled = isFallbackEnabled();

  if (!uri) {
    const error = new Error('DATABASE_URL is not set');
    if (!fallbackEnabled) {
      throw error;
    }

    console.warn('DATABASE_URL is not set. USE_FALLBACK=true so continuing in fallback mode.');
    return false;
  }

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    postgresConnected = true;
    console.log('PostgreSQL Connected');
    return true;
  } catch (error) {
    postgresConnected = false;
    if (fallbackEnabled) {
      console.warn(`PostgreSQL connection failed. USE_FALLBACK=true so continuing in fallback mode. ${error.message}`);
      return false;
    }

    throw error;
  }
}

module.exports = {
  connectDatabase,
  getMongoStatus,
  getMongoHealth,
  getDatabaseHealth,
  isMongoConnected,
  isPostgresConnected,
  isFallbackEnabled
};
