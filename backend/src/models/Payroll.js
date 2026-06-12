const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    payrollCode: String,
    employeeCode: String,
    month: String,
    base: Number,
    bonus: Number,
    deductions: Number,
    net: Number,
    benchmark: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payroll', payrollSchema);
