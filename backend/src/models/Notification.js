const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: String,
    severity: { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
    title: String,
    detail: String,
    message: String,
    employeeId: String,
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
