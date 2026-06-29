require('dotenv').config();

const { createServer } = require('http');
const { Server } = require('socket.io');
const { createApp } = require('./app');
const { connectDatabase, getDatabaseHealth } = require('./config/db');
const { seedPostgresCollections } = require('./services/hrStore');
const { seedUsers } = require('./services/authService');
const { seedNotifications } = require('./services/notificationService');
const { setSocketServer } = require('./services/socketService');

const port = process.env.PORT || 5000;

async function bootstrap() {
  await connectDatabase();
  const health = getDatabaseHealth();

  if (health.success) {
    console.log('PostgreSQL Connected');
  } else {
    console.warn(`PostgreSQL is ${health.postgresStatus}`);
  }

  await seedPostgresCollections();
  await seedUsers();
  await seedNotifications();

  const app = createApp();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PATCH']
    }
  });

  setSocketServer(io);

  io.on('connection', () => {});

  httpServer.listen(port, () => {
    console.log(`HRMS backend listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});
