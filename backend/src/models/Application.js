const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    applicationCode: String,
    jobCode: String,
    name: String,
    score: Number,
    stage: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);
