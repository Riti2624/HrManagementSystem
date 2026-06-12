const mongoose = require('mongoose');

const recruitmentSchema = new mongoose.Schema(
  {
    jobCode: String,
    title: String,
    department: String,
    status: String,
    applicants: Number,
    priority: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recruitment', recruitmentSchema);
