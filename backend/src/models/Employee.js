const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: String,
    name: String,
    role: String,
    department: String,
    email: String,
    phone: String,
    location: String,
    status: String,
    salary: Number,
    performanceScore: Number,
    attendanceRate: Number,
    sentimentScore: Number,
    skills: [String],
    workload: Number,
    attritionRisk: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
