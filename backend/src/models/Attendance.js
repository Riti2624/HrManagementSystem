const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    attendanceCode: String,
    employeeCode: String,
    date: String,
    checkIn: String,
    checkOut: String,
    status: String,
    geo: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
