const { GoogleGenerativeAI } = (() => {
  try {
    return require('@google/generative-ai');
  } catch (_error) {
    return {};
  }
})();

const GEMINI_MODEL = process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash';

/**
 * Rule-based skill-match scoring.
 * Compares candidate.skills[] vs job requirements (comma-separated string).
 * Returns a 0-100 score + summary bullets.
 */
function scoreResume({ candidateSkills = [], jobRequirements = '', candidateName = '', jobTitle = '' }) {
  const required = jobRequirements
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const skills = (candidateSkills || []).map((s) => String(s).trim().toLowerCase());

  if (required.length === 0) {
    return {
      score: Math.min(100, 50 + skills.length * 3),
      matched: skills.slice(0, 5),
      missing: [],
      summary: `${candidateName || 'Candidate'} profile screened for ${jobTitle || 'position'}. No specific requirements listed; scored on overall profile strength.`,
      strengths: skills.slice(0, 3),
      gaps: []
    };
  }

  const matched = required.filter((req) =>
    skills.some((skill) => skill.includes(req) || req.includes(skill))
  );
  const missing = required.filter((req) =>
    !skills.some((skill) => skill.includes(req) || req.includes(skill))
  );

  const baseScore = required.length > 0 ? Math.round((matched.length / required.length) * 70) : 40;
  // Bonus: extra skills beyond requirements
  const bonusScore = Math.min(20, (skills.length - matched.length) * 2);
  // Profile completeness bonus
  const profileBonus = candidateName ? 5 : 0;
  const score = Math.min(100, Math.max(10, baseScore + bonusScore + profileBonus + 5));

  const summary = matched.length >= required.length * 0.7
    ? `Strong match. ${candidateName || 'Candidate'} meets ${matched.length}/${required.length} requirements for ${jobTitle || 'this role'}.`
    : matched.length > 0
    ? `Partial match. ${candidateName || 'Candidate'} meets ${matched.length}/${required.length} requirements. Upskilling needed in: ${missing.slice(0, 3).join(', ')}.`
    : `Weak match. Candidate skills do not sufficiently align with ${jobTitle || 'this role'} requirements.`;

  return {
    score,
    matched,
    missing,
    summary,
    strengths: matched.slice(0, 5),
    gaps: missing.slice(0, 5)
  };
}

/**
 * Gemini-powered resume screening.
 * Falls back to rule-based if API key is absent or call fails.
 */
async function screenResumeWithGemini({ candidateSkills, candidateName, jobTitle, jobDescription, jobRequirements }) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const fallback = scoreResume({ candidateSkills, jobRequirements, candidateName, jobTitle });

  if (!apiKey || !GoogleGenerativeAI) {
    return { ...fallback, source: 'rule-based' };
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `You are an expert technical recruiter performing ATS resume screening.

Job Title: ${jobTitle || 'N/A'}
Job Description: ${jobDescription || 'N/A'}
Required Skills/Keywords: ${jobRequirements || 'N/A'}

Candidate Name: ${candidateName || 'Anonymous'}
Candidate Skills: ${(candidateSkills || []).join(', ') || 'None listed'}

Evaluate this candidate and return a JSON object with EXACTLY these fields:
{
  "score": <integer 0-100>,
  "summary": "<2-3 sentence assessment>",
  "strengths": ["<skill1>", "<skill2>", "<skill3>"],
  "gaps": ["<missing1>", "<missing2>"]
}

Return ONLY valid JSON, no markdown, no extra text.`;

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.()?.trim() || '';
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());

    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || fallback.score)),
      summary: parsed.summary || fallback.summary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : fallback.strengths,
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : fallback.gaps,
      matched: fallback.matched,
      missing: fallback.missing,
      source: 'gemini'
    };
  } catch (error) {
    console.warn('Gemini resume screening failed, using rule-based fallback:', error.message);
    return { ...fallback, source: 'rule-based' };
  }
}

/**
 * Screen a single application against its job.
 * Returns updated aiScore + aiSummary.
 */
async function screenApplication({ application, job, candidate }) {
  const result = await screenResumeWithGemini({
    candidateSkills: candidate?.skills || [],
    candidateName: candidate?.name || application?.name || '',
    jobTitle: job?.title || '',
    jobDescription: job?.description || '',
    jobRequirements: job?.requirements || ''
  });

  return {
    aiScore: result.score,
    aiSummary: result.summary,
    strengths: result.strengths,
    gaps: result.gaps,
    source: result.source
  };
}

/**
 * Rank all applications for a job by aiScore (desc), then by score (desc).
 */
function rankApplications(applications) {
  return [...applications].sort((a, b) => {
    const scoreA = Number(a.aiScore) || Number(a.score) || 0;
    const scoreB = Number(b.aiScore) || Number(b.score) || 0;
    return scoreB - scoreA;
  });
}

/**
 * Compute hiring funnel analytics for a set of applications.
 */
function computeFunnelAnalytics(applications, jobs) {
  const STAGE_ORDER = ['New', 'Shortlisted', 'HR Interview', 'Tech Interview', 'Managerial Interview', 'Offer', 'Hired', 'Rejected'];

  const stageCounts = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = 0;
    return acc;
  }, {});

  for (const app of applications) {
    const stage = app.stage || 'New';
    if (stageCounts[stage] !== undefined) {
      stageCounts[stage]++;
    } else {
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    }
  }

  const total = applications.length;
  const funnelData = STAGE_ORDER.map((stage) => ({
    stage,
    count: stageCounts[stage] || 0,
    percentage: total > 0 ? Math.round(((stageCounts[stage] || 0) / total) * 100) : 0
  }));

  // Conversion rates between consecutive active stages
  const activeStages = ['New', 'Shortlisted', 'HR Interview', 'Tech Interview', 'Managerial Interview', 'Offer', 'Hired'];
  const conversionRates = activeStages.slice(1).map((stage, i) => {
    const from = activeStages[i];
    const fromCount = stageCounts[from] || 0;
    const toCount = stageCounts[stage] || 0;
    return {
      from,
      to: stage,
      rate: fromCount > 0 ? Math.round((toCount / (fromCount + toCount)) * 100) : 0
    };
  });

  // Open vs closed jobs
  const openJobs = (jobs || []).filter((j) => j.status === 'Open').length;
  const closedJobs = (jobs || []).filter((j) => j.status !== 'Open').length;
  const avgAiScore = applications.length > 0
    ? Math.round(applications.reduce((s, a) => s + (Number(a.aiScore) || Number(a.score) || 0), 0) / applications.length)
    : 0;

  const hiredCount = stageCounts['Hired'] || 0;
  const offerCount = stageCounts['Offer'] || 0;
  const overallConversion = total > 0 ? Math.round(((hiredCount + offerCount) / total) * 100) : 0;

  return {
    funnelData,
    conversionRates,
    stageCounts,
    total,
    openJobs,
    closedJobs,
    avgAiScore,
    overallConversion,
    hiredCount,
    rejectedCount: stageCounts['Rejected'] || 0
  };
}

module.exports = {
  screenApplication,
  rankApplications,
  computeFunnelAnalytics,
  scoreResume
};
