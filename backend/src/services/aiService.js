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

const GEMINI_MODEL = process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash';

async function buildAnalyticsContext(prompt) {
  const [dashboard, attendance, attrition, payroll, recruitment, employees] = await Promise.all([
    calculateDashboard(),
    attendanceInsights(),
    attritionAnalysis(),
    payrollInsights(),
    recruitmentInsights(),
    enrichEmployees()
  ]);

  return {
    dashboard,
    attendance,
    attrition,
    payroll,
    recruitment,
    employees: employees.slice(0, 10),
    leaveSuggestions: leaveSuggestions(),
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
  const highRisk = context.attrition.filter((employee) => employee.risk === 'High').length;
  const pendingLeaves = context.dashboard.openLeaveRequests;
  const pipeline = context.recruitment.applications.length;

  return {
    summary: `Today's HR Summary: Attendance dropped ${attendanceDelta}% from target. ${highRisk} employees are at high attrition risk. ${pendingLeaves} leave requests remain pending. Recruitment pipeline added ${pipeline} candidates.`,
    bullets: [
      `${attendanceDelta}% attendance gap against target.`,
      `${highRisk} high-risk employees require follow-up.`,
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
    const result = await model.generateContent(`Create a concise executive HR daily summary from this analytics context. Return plain text only.\n${JSON.stringify(context, null, 2)}`);
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
