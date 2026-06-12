const PDFDocument = require('pdfkit');
const { calculateDashboard, attendanceInsights, attritionAnalysis, payrollInsights, recruitmentInsights } = require('./hrLogic');
const { listLeaves } = require('./hrStore');
const { generateDailySummary } = require('./aiService');

function writeSection(doc, title, lines) {
  doc.moveDown(1);
  doc.fontSize(14).fillColor('#0f172a').text(title);
  doc.moveDown(0.25);
  doc.fontSize(10).fillColor('#334155');
  lines.forEach((line) => {
    doc.text(`- ${line}`);
  });
}

async function generateHrSummaryPdf(res) {
  const [dashboard, attendance, attrition, payroll, recruitment, leaves, summary] = await Promise.all([
    calculateDashboard(),
    attendanceInsights(),
    attritionAnalysis(),
    payrollInsights(),
    recruitmentInsights(),
    listLeaves(),
    generateDailySummary()
  ]);

  const doc = new PDFDocument({ margin: 48, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="hr-summary.pdf"');
  doc.pipe(res);

  doc.fontSize(22).fillColor('#0f172a').text('Company HR Report');
  doc.fontSize(10).fillColor('#475569').text(`Date generated: ${new Date().toLocaleString()}`);
  doc.moveDown();

  writeSection(doc, 'KPIs', [
    `Total employees: ${dashboard.totalEmployees}`,
    `Attendance rate: ${dashboard.attendanceRate}%`,
    `High attrition risk: ${dashboard.attritionRiskCount}`,
    `Open leave requests: ${dashboard.openLeaveRequests}`,
    `Recruitment pipeline: ${dashboard.hiringPipeline}`
  ]);

  writeSection(doc, 'Attendance', [
    `Present: ${attendance.summary.presentCount}`,
    `Late: ${attendance.summary.lateCount}`,
    `Absent: ${attendance.summary.absentCount}`
  ]);

  writeSection(doc, 'Payroll', payroll.slice(0, 5).map((item) => `${item.employeeId} - ${item.net} (${item.benchmarkLabel})`));
  writeSection(doc, 'Attrition', attrition.slice(0, 5).map((item) => `${item.name} - ${item.risk} (${item.riskScore})`));
  writeSection(doc, 'Recruitment', [
    `Jobs: ${recruitment.jobs.length}`,
    `Applications: ${recruitment.applications.length}`
  ]);
  writeSection(doc, 'Compliance / Leave', [
    `Leave requests: ${leaves.length}`,
    `Pending leave: ${dashboard.openLeaveRequests}`
  ]);
  writeSection(doc, 'AI Executive Summary', [summary.summary, ...summary.bullets.slice(0, 3)]);

  doc.end();
}

module.exports = { generateHrSummaryPdf };
