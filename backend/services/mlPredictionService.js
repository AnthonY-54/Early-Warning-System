const { evaluateRisk } = require('./riskEvaluationService');

/**
 * Predicts risk and explainability for a single milestone using the FastAPI ML service.
 * Falls back silently to placeholder calculations if the ML service is unreachable.
 */
const predictMilestone = async (studentData, milestone) => {
  const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  const milestoneNumber = parseInt(milestone.stage.replace('%', ''), 10) || 20;

  const payload = {
    code_module: studentData.code_module || 'BBB',
    code_presentation: studentData.code_presentation || '2013J',
    gender: studentData.gender || 'M',
    region: studentData.region || 'London Region',
    highest_education: studentData.highest_education || 'A Level or Equivalent',
    imd_band: studentData.imd_band || '50-60%',
    age_band: studentData.age_band || '0-35',
    studied_credits: Number(studentData.studied_credits) || 60,
    disability: studentData.disability || 'N',
    is_repeat: Number(studentData.is_repeat) || 0,
    registration_lag: Number(studentData.registration_lag) || -30,
    milestone: milestoneNumber,
    assessment_score: Number(milestone.assessment_score) || 0,
    days_late: Number(milestone.days_late) || 0,
    total_clicks: Number(milestone.total_clicks) || 0,
    active_days: Number(milestone.active_days) || 0,
    resources_accessed: Number(milestone.resources_accessed) || 0
  };

  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`ML service responded with status ${response.status}`);
    }

    const data = await response.json();

    // Map risk_score (0-100) to probability (0-1 scale)
    const rawScore = typeof data.risk_score === 'number' ? data.risk_score : 50;
    const probability = Math.max(0, Math.min(1, rawScore / 100));
    const hasActivity = milestone.active_days > 0;
    const riskLevel = evaluateRisk(probability, hasActivity);
    const confidence = 0.80; // Standard proxy constant
    const topReasons = Array.isArray(data.top_reasons) ? data.top_reasons : [];

    return {
      stage: milestone.stage,
      assessment_score: milestone.assessment_score,
      days_late: milestone.days_late || 0,
      total_clicks: milestone.total_clicks || 0,
      active_days: milestone.active_days || 0,
      resources_accessed: milestone.resources_accessed || 0,
      probability,
      risk_level: riskLevel,
      confidence,
      top_reasons: topReasons
    };

  } catch (error) {
    console.warn(`ML service unavailable for milestone ${milestone.stage} (${error.message}). Using placeholder fallback.`);

    const hasActivity = milestone.active_days > 0;
    let prob = 0;
    if (hasActivity) {
      const score = milestone.assessment_score !== undefined ? milestone.assessment_score : 70;
      prob = Math.max(0, Math.min(1, (100 - score) / 100));
    }
    const risk = evaluateRisk(prob, hasActivity);

    return {
      stage: milestone.stage,
      assessment_score: milestone.assessment_score,
      days_late: milestone.days_late || 0,
      total_clicks: milestone.total_clicks || 0,
      active_days: milestone.active_days || 0,
      resources_accessed: milestone.resources_accessed || 0,
      probability: prob,
      risk_level: risk,
      confidence: 0.80,
      top_reasons: []
    };
  }
};

/**
 * Sequentially computes predictions for all milestones of a student.
 */
const predictMilestones = async (studentData) => {
  const rawMilestones = studentData.milestones || [];
  const resolvedMilestones = [];

  for (const m of rawMilestones) {
    const predictedMilestone = await predictMilestone(studentData, m);
    resolvedMilestones.push(predictedMilestone);
  }

  return resolvedMilestones;
};

module.exports = {
  predictMilestone,
  predictMilestones
};
