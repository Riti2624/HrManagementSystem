const { GoogleGenerativeAI } = (() => {
  try {
    return require('@google/generative-ai');
  } catch (_error) {
    return {};
  }
})();

const {
  calculateDashboard,
  attendanceInsights,
  leaveSuggestions,
  attritionAnalysis,
  payrollInsights,
  recruitmentInsights,
  enrichEmployees
} = require('./hrLogic');
const { listLeaves } = require('./hrStore');

const GEMINI_MODEL = process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash';

async function buildAnalyticsContext(prompt) {
  const [dashboard, attendance, attrition, payroll, recruitment, employees, leaves, leaveGuidance] = await Promise.all([
    calculateDashboard(),
    attendanceInsights(),
    attritionAnalysis(),
    payrollInsights(),
    recruitmentInsights(),
    enrichEmployees(),
    listLeaves(),
    leaveSuggestions()
  ]);

  return {
    dashboard,
    attendance,
    attrition,
    payroll,
    recruitment,
    employees: employees.slice(0, 10),
    leaves,
    leaveSuggestions: leaveGuidance,
    userQuery: prompt || ''
  };
}

function summarizeContext(context) {
  const highRiskEmployees = context.attrition.filter((employee) => employee.risk === 'High');
  const underMarketPayroll = context.payroll.filter((entry) => entry.benchmark < 0.9);
  const topAttacks = context.attendance.summary.lateCount + context.attendance.summary.absentCount;

  return {
    answer: `HR analytics summary for ${context.dashboard.totalEmployees} employees.`,
    bullets: [
      `${context.dashboard.attritionRiskCount} employees are high attrition risk.`,
      `${topAttacks} attendance exceptions were recorded in the latest snapshot.`,
      `${underMarketPayroll.length} payroll records are below the market benchmark.`,
      `${context.dashboard.openLeaveRequests} leave requests are still pending.`
    ],
    recommendations: [
      highRiskEmployees.length ? `Prioritize retention plans for ${highRiskEmployees.slice(0, 3).map((employee) => employee.name).join(', ')}.` : 'Maintain current retention controls.',
      underMarketPayroll.length ? 'Review compensation bands for below-market roles.' : 'Continue monitoring payroll benchmarks.',
      context.dashboard.highRiskEmployees.length ? 'Address workload pressure in the flagged teams.' : 'Keep weekly manager check-ins active.'
    ]
  };
}

async function buildFallbackResponse(prompt) {
  const context = await buildAnalyticsContext(prompt);
  const summary = summarizeContext(context);

  return {
    ...summary,
    source: 'analytics'
  };
}

function buildDailySummary(context) {
  const attendanceDelta = Math.max(0, 100 - Number(context.dashboard.attendanceRate || 0));
  const highRiskEmployees = context.attrition.filter((employee) => employee.risk === 'High');
  const pendingLeaves = context.dashboard.openLeaveRequests;
  const pipeline = context.recruitment.applications.length;
  const openJobs = context.recruitment.jobs.filter((job) => job.status !== 'Closed');
  const belowMarketPayroll = context.payroll.filter((entry) => entry.benchmark < 0.9);
  const highSeverityAlerts = context.dashboard.notifications.filter((notification) => notification.severity === 'high');
  const attendanceExceptions = context.attendance.summary.lateCount + context.attendance.summary.absentCount;
  const departmentsAtRisk = [...new Set(highRiskEmployees.map((employee) => employee.department))];
  const topRiskEmployees = highRiskEmployees.slice(0, 3).map((employee) => employee.name).join(', ') || 'No named employees';
  const pendingLeaveItems = context.leaves.filter((leave) => leave.status === 'Pending');
  const stageCounts = Object.entries(context.recruitment.scores)
    .map(([stage, count]) => `${stage}: ${count}`)
    .join(', ') || 'No active candidate stages';

  return {
    summary: `1. Executive Overview
Overall workforce health is stable but requires active management attention. The organization has ${context.dashboard.totalEmployees} employees, an attendance rate of ${context.dashboard.attendanceRate}%, ${highRiskEmployees.length} high attrition-risk employees, ${pendingLeaves} pending leave requests, and ${pipeline} candidates in the recruitment pipeline. Compared with the operating target, attendance is running ${attendanceDelta}% below full availability; no prior-day snapshot is available in the current analytics context, so changes since yesterday should be treated as unavailable rather than inferred.

2. Workforce Status
Attendance performance shows ${context.attendance.summary.presentCount} present records, ${context.attendance.summary.lateCount} late records, and ${context.attendance.summary.absentCount} absences, creating ${attendanceExceptions} operational exceptions for manager review. Workforce availability remains serviceable, but late arrivals and absences should be watched closely where they intersect with high workload or retention risk.

3. Attrition & Retention Risks
There are ${highRiskEmployees.length} employees currently assessed as high retention risk, led by ${topRiskEmployees}. The affected departments are ${departmentsAtRisk.join(', ') || 'not materially concentrated in one department'}. Recommended intervention is targeted manager outreach, workload review, and compensation calibration where salary benchmarks are below market.

4. Leave & Availability
There are ${pendingLeaves} pending leave requests, with ${pendingLeaveItems.length} items awaiting manager action in the current queue. Leave guidance indicates: ${context.leaveSuggestions.join(' ')} Managers should prioritize approvals that preserve coverage in strained departments and avoid compounding attendance gaps.

5. Recruitment Pipeline
Recruitment currently has ${openJobs.length} open positions and ${pipeline} active applications. Candidate progress by stage is ${stageCounts}. The principal bottleneck is any stage with accumulated volume but limited movement to shortlist or offer; recruiting leads should focus on converting high-score candidates and closing roles with business-critical coverage impact.

6. Payroll & Cost Insights
Payroll analytics show ${belowMarketPayroll.length} records below market benchmark. Cost risk is concentrated where below-market compensation overlaps with high attrition risk or high workload. Overtime-specific data is not available in the current analytics context, so overtime exposure should be reviewed through timekeeping before any cost forecast is finalized.

7. Critical Alerts
${highSeverityAlerts.length ? highSeverityAlerts.map((alert) => `${alert.title}: ${alert.detail}`).join(' ') : 'No high severity issues are active in the current alert feed.'}

8. Recommended Actions (Top 5)
First, hold retention reviews for the highest-risk employees and their managers. Second, clear pending leave decisions with coverage checks by department. Third, investigate late and absent attendance exceptions where they affect operational coverage. Fourth, accelerate high-score candidates through the recruitment funnel for open roles. Fifth, review below-market payroll records for retention-sensitive roles before the next compensation cycle.`,
    bullets: [
      `${attendanceDelta}% attendance gap against target.`,
      `${highRiskEmployees.length} high-risk employees require follow-up.`,
      `${pendingLeaves} leave requests are still pending.`,
      `${pipeline} candidates are active in recruitment.`
    ],
    recommendations: summarizeContext(context).recommendations
  };
}

async function generateDailySummary() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const context = await buildAnalyticsContext('Generate today HR daily summary');
  const fallback = buildDailySummary(context);

  if (!apiKey || !GoogleGenerativeAI) {
    return { ...fallback, source: 'analytics' };
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(`You are a Chief People Officer preparing a daily executive HR briefing.

Analyze the HRMS analytics provided and generate a professional business report.

Structure:

1. Executive Overview
   - Overall workforce health
   - Key changes since yesterday

2. Workforce Status
   - Attendance trends
   - Workforce availability
   - Operational impact

3. Attrition & Retention Risks
   - Employees at risk
   - Departments affected
   - Recommended actions

4. Leave & Availability
   - Pending leave requests
   - Upcoming workforce shortages
   - Manager attention items

5. Recruitment Pipeline
   - Open positions
   - Candidate progress
   - Hiring bottlenecks

6. Payroll & Cost Insights
   - Payroll observations
   - Overtime trends
   - Cost risks

7. Critical Alerts
   - High severity issues only

8. Recommended Actions (Top 5)

Use professional executive language.
Avoid bullet spam.
Write like a management consultant preparing a report for leadership.
If a metric, prior-day comparison, or overtime field is unavailable, state that it is unavailable rather than inventing a value.
Return plain text only.

Analytics:
${JSON.stringify(context, null, 2)}`);
    return {
      ...fallback,
      summary: result?.response?.text?.()?.trim() || fallback.summary,
      source: 'gemini'
    };
  } catch (error) {
    console.warn('Gemini daily summary failed, using analytics fallback', error.message);
    return { ...fallback, source: 'analytics' };
  }
}

async function generateCopilotResponse(prompt) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const context = await buildAnalyticsContext(prompt);
  const fallback = summarizeContext(context);

  if (!apiKey || !GoogleGenerativeAI) {
    return {
      ...fallback,
      source: 'analytics'
    };
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: GEMINI_MODEL });
    const systemPrompt = `You are an HR analytics AI assistant.
Use the following real HR dataset:
${JSON.stringify(context, null, 2)}
User Question:
${prompt || ''}
Return:
1. Insight summary
2. Key risks
3. Employee/team level analysis
4. Actionable HR recommendations`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result?.response?.text?.() || '';

    return {
      answer: responseText.trim() || fallback.answer,
      bullets: fallback.bullets,
      recommendations: fallback.recommendations,
      source: 'gemini'
    };
  } catch (error) {
    console.warn('Gemini request failed, using analytics fallback', error.message);
    return {
      ...fallback,
      source: 'analytics'
    };
  }
}

module.exports = { generateCopilotResponse, generateDailySummary, buildFallbackResponse };
