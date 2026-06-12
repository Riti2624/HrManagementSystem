const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    leaveCode: String,
    employeeCode: String,
    type: String,
    from: String,
    to: String,
    reason: String,
    status: String,
    balanceAfter: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leave', leaveSchema);
