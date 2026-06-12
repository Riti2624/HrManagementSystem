const { prisma } = require('../config/prisma');
const { notifications: seedNotificationItems } = require('../data/seedData');
const { isPostgresConnected } = require('../config/db');
const { emitSocketEvent } = require('./socketService');

const memoryNotifications = seedNotificationItems.map((item) => ({
  ...item,
  read: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

function serializeNotification(record) {
  return {
    id: String(record._id ?? record.id),
    type: record.type || 'info',
    severity: record.severity || 'low',
    title: record.title,
    detail: record.detail || record.message || '',
    message: record.message || record.detail || '',
    employeeId: record.employeeId,
    read: Boolean(record.read),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

async function seedNotifications() {
  if (!isPostgresConnected() || (await prisma.notification.count()) > 0) {
    return;
  }

  await prisma.notification.createMany({
    data: seedNotificationItems.map(({ id, ...item }) => ({
      ...item,
      message: item.message || item.detail || '',
      read: false,
      severity: item.severity || 'low'
    })),
    skipDuplicates: true
  });
}

async function listNotifications() {
  if (isPostgresConnected()) {
    const records = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    return records.map(serializeNotification);
  }

  return memoryNotifications.map(serializeNotification);
}

async function createNotification(payload, options = {}) {
  const notificationPayload = {
    type: payload.type || 'info',
    severity: payload.severity || 'low',
    title: payload.title,
    detail: payload.detail || payload.message || '',
    message: payload.message || payload.detail || '',
    employeeId: payload.employeeId,
    read: false
  };

  let notification;
  if (isPostgresConnected()) {
    const record = await prisma.notification.create({ data: notificationPayload });
    notification = serializeNotification(record);
  } else {
    notification = serializeNotification({
      ...notificationPayload,
      id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    memoryNotifications.unshift(notification);
  }

  if (options.emit !== false) {
    emitSocketEvent('hr:alert', notification);
    emitSocketEvent('notification:created', notification);
  }

  return notification;
}

async function markNotificationRead(id) {
  if (isPostgresConnected()) {
    const record = await prisma.notification.update({ where: { id }, data: { read: true } }).catch((error) => {
      if (error.code === 'P2025') {
        return null;
      }
      throw error;
    });
    return record ? serializeNotification(record) : null;
  }

  const notification = memoryNotifications.find((item) => item.id === id);
  if (!notification) {
    return null;
  }

  notification.read = true;
  notification.updatedAt = new Date().toISOString();
  return serializeNotification(notification);
}

async function markAllNotificationsRead() {
  if (isPostgresConnected()) {
    await prisma.notification.updateMany({ where: { read: { not: true } }, data: { read: true } });
    return listNotifications();
  }

  memoryNotifications.forEach((notification) => {
    notification.read = true;
    notification.updatedAt = new Date().toISOString();
  });
  return listNotifications();
}

module.exports = {
  seedNotifications,
  listNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead
};
