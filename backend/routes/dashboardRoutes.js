const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const { generateFeedback } = require('../services/feedbackService');

// Route: Get Logged-in Student Dashboard Data
router.get('/student/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Student account required.' });
    }

    if (!user.studentId) {
      return res.status(400).json({ message: 'No student record associated with this account.' });
    }

    const student = await Student.findOne({ student_id: user.studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student data not found in database.' });
    }

    // Sourced from current stage milestone
    const currentMilestone = student.milestones?.find(m => m.stage === student.stage) || 
      student.milestones?.[student.milestones.length - 1] || {};

    const riskLevel = currentMilestone.risk_level || "Green";
    const confidenceVal = currentMilestone.confidence !== undefined ? currentMilestone.confidence : 0.80;
    const feedbackText = generateFeedback(riskLevel, confidenceVal, { weakTopic: student.weakTopic });

    return res.json({
      id: student.student_id,
      name: student.name,
      course: student.course || "General Studies",
      stage: student.stage || "40%",
      probability: currentMilestone.probability !== undefined ? currentMilestone.probability : 0,
      engagement: {
        clicks: currentMilestone.total_clicks || 0,
        active_days: currentMilestone.active_days || 0,
        resources_viewed: currentMilestone.resources_accessed || 0
      },
      performance_timeline: (student.milestones || []).map(m => ({
        stage: m.stage,
        score: m.assessment_score !== undefined ? m.assessment_score : 0,
        risk: m.risk_level || 'Green'
      })),
      weakTopic: student.weakTopic || "None",
      risk_level: riskLevel,
      feedback: feedbackText,
      confidence: (confidenceVal * 100).toFixed(1) + "%"
    });

  } catch (error) {
    console.error('Error fetching student dashboard data:', error);
    return res.status(500).json({ message: 'Server error fetching student data.' });
  }
});

// Route: Get Teacher Dashboard Data — Real Aggregated MongoDB Data
router.get('/teacher/overview', auth, async (req, res) => {
  try {
    const students = await Student.find({});

    const totalCohort = students.length;

    // Count students per risk level and aggregate class averages
    const counts = { Green: 0, Yellow: 0, Red: 0, Black: 0 };
    let totalClicks = 0;
    let totalActiveDays = 0;
    let totalResourcesViewed = 0;

    // Format full student list reshaped for frontend components
    const studentList = students.map(s => {
      const currentMilestone = s.milestones?.find(m => m.stage === s.stage) || 
        s.milestones?.[s.milestones.length - 1] || {};

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
        trend: 'stable' // Placeholder pending multi-sync historical data
      };
    });

    // At-Risk Rate: percentage of students with risk other than Green
    const atRiskCount = counts.Yellow + counts.Red + counts.Black;
    const atRiskRate = totalCohort > 0 ? Math.round((atRiskCount / totalCohort) * 100) : 0;

    // Calculate percentage breakdown for Pie Chart distribution
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

    return res.json({
      totalCohort,
      atRiskRate,
      distribution,
      classAverages,
      students: studentList
    });

  } catch (error) {
    console.error('Error fetching teacher dashboard overview:', error);
    return res.status(500).json({ message: 'Server error fetching teacher overview.' });
  }
});

module.exports = router;



