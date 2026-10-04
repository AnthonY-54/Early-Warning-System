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

const { computeCohortAggregation } = require('../utils/cohortUtils');

// Route: Get Teacher Dashboard Data — Real Aggregated MongoDB Data
router.get('/teacher/overview', auth, async (req, res) => {
  try {
    const students = await Student.find({});
    const cohortData = computeCohortAggregation(students);
    return res.json(cohortData);
  } catch (error) {
    console.error('Error fetching teacher dashboard overview:', error);
    return res.status(500).json({ message: 'Server error fetching teacher overview.' });
  }
});

module.exports = router;



