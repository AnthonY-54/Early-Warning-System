const Student = require('../models/Student');
const { generateFeedback } = require('../services/feedbackService');

/**
 * Extract current milestone based on student's current stage or latest milestone.
 */
function getCurrentMilestone(student) {
  if (!student || !Array.isArray(student.milestones)) return {};
  return student.milestones.find(m => m.stage === student.stage) ||
    student.milestones[student.milestones.length - 1] || {};
}

/**
 * Computes cohort aggregation metrics and averages across all students.
 * Reusable between teacher dashboard overview route and teacher chatbot tools.
 */
function computeCohortAggregation(students) {
  const totalCohort = students.length;
  const counts = { Green: 0, Yellow: 0, Red: 0, Black: 0 };
  let totalClicks = 0;
  let totalActiveDays = 0;
  let totalResourcesViewed = 0;

  const formattedStudents = students.map(s => {
    const currentMilestone = getCurrentMilestone(s);
    const r = currentMilestone.risk_level || 'Green';
    if (counts[r] !== undefined) {
      counts[r]++;
    } else {
      counts['Green']++;
    }

    const clicks = currentMilestone.total_clicks || 0;
    const activeDays = currentMilestone.active_days || 0;
    const resourcesViewed = currentMilestone.resources_accessed || 0;

    totalClicks += clicks;
    totalActiveDays += activeDays;
    totalResourcesViewed += resourcesViewed;

    const confidenceVal = currentMilestone.confidence !== undefined ? currentMilestone.confidence : 0.80;
    const feedbackText = generateFeedback(r, confidenceVal, { weakTopic: s.weakTopic });

    return {
      id: s.student_id,
      name: s.name,
      prob: currentMilestone.probability !== undefined ? currentMilestone.probability : 0,
      risk: r,
      course: s.course || 'N/A',
      weakTopic: s.weakTopic || 'N/A',
      top_reasons: currentMilestone.top_reasons || [],
      stage: s.stage || '40%',
      demographics: {
        age_band: s.age_band || 'N/A',
        education: s.highest_education || 'N/A',
        imd_band: s.imd_band || 'N/A'
      },
      enrollment_info: {
        module: s.code_module || 'N/A',
        presentation: s.code_presentation || 'N/A',
        status: s.enrollment_info?.status || 'Active'
      },
      engagement: {
        clicks,
        active_days: activeDays,
        resources_viewed: resourcesViewed
      },
      performance_timeline: (s.milestones || []).map(m => ({
        stage: m.stage,
        score: m.assessment_score !== undefined ? m.assessment_score : 0,
        risk: m.risk_level || 'Green'
      })),
      confidence: confidenceVal,
      feedback: feedbackText,
      trend: 'stable'
    };
  });

  const atRiskCount = counts.Yellow + counts.Red + counts.Black;
  const atRiskRate = totalCohort > 0 ? Math.round((atRiskCount / totalCohort) * 100) : 0;

  const distribution = [
    { name: 'Green', value: totalCohort > 0 ? Math.round((counts.Green / totalCohort) * 100) : 0, fill: '#10b981' },
    { name: 'Yellow', value: totalCohort > 0 ? Math.round((counts.Yellow / totalCohort) * 100) : 0, fill: '#f59e0b' },
    { name: 'Red', value: totalCohort > 0 ? Math.round((counts.Red / totalCohort) * 100) : 0, fill: '#ef4444' },
    { name: 'Black', value: totalCohort > 0 ? Math.round((counts.Black / totalCohort) * 100) : 0, fill: '#1f2937' }
  ];

  const classAverages = {
    clicks: totalCohort > 0 ? Math.round(totalClicks / totalCohort) : 0,
    activeDays: totalCohort > 0 ? Math.round(totalActiveDays / totalCohort) : 0,
    resourcesViewed: totalCohort > 0 ? Math.round(totalResourcesViewed / totalCohort) : 0
  };

  return {
    totalCohort,
    counts,
    atRiskCount,
    atRiskRate,
    distribution,
    classAverages,
    students: formattedStudents
  };
}

/**
 * Fetch and return aggregate summary metrics for the entire cohort.
 */
async function getCohortSummary() {
  const students = await Student.find({});
  const agg = computeCohortAggregation(students);
  return {
    totalCohort: agg.totalCohort,
    riskDistribution: agg.counts,
    atRiskCount: agg.atRiskCount,
    atRiskRate: `${agg.atRiskRate}%`,
    classAverages: agg.classAverages
  };
}

/**
 * Filter students by course and/or risk level.
 */
async function getStudentsByFilter({ course, risk_level }) {
  const students = await Student.find({});
  const normalizedCourse = course ? course.toLowerCase().trim() : null;
  const normalizedRisk = risk_level ? risk_level.toLowerCase().trim() : null;

  const filtered = [];
  for (const s of students) {
    const milestone = getCurrentMilestone(s);
    const risk = milestone.risk_level || 'Green';
    const studentCourse = s.course || 'N/A';

    let match = true;
    if (normalizedCourse && !studentCourse.toLowerCase().includes(normalizedCourse)) {
      match = false;
    }
    if (normalizedRisk && risk.toLowerCase() !== normalizedRisk) {
      match = false;
    }

    if (match) {
      filtered.push({
        id: s.student_id,
        name: s.name,
        risk_level: risk,
        course: studentCourse
      });
    }
  }

  return filtered;
}

module.exports = {
  getCurrentMilestone,
  computeCohortAggregation,
  getCohortSummary,
  getStudentsByFilter
};
