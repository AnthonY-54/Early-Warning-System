const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

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

    // Return the real, persisted fields from MongoDB
    const confidenceVal = student.confidence !== undefined ? student.confidence : 0.80;

    return res.json({
      id: student.student_id,
      name: student.name,
      course: student.course || "General Studies",
      stage: student.stage || "40%",
      probability: student.probability,
      engagement: student.engagement || { clicks: 0, active_days: 0, resources_viewed: 0 },
      performance_timeline: student.performance_timeline || [],
      weakTopic: student.weakTopic || "None",
      risk_level: student.risk_level || "Green",
      feedback: student.feedback || "",
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

    // Count students per risk level
    const counts = { Green: 0, Yellow: 0, Red: 0, Black: 0 };
    students.forEach(s => {
      const r = s.risk_level || 'Green';
      if (counts[r] !== undefined) {
        counts[r]++;
      } else {
        counts['Green']++;
      }
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

    // Format full student list for the table and profile modal
    const studentList = students.map(s => ({
      id: s.student_id,
      name: s.name,
      prob: s.probability !== undefined ? s.probability : 0,
      risk: s.risk_level || 'Green',
      course: s.course || 'N/A',
      weakTopic: s.weakTopic || 'N/A',
      stage: s.stage || '40%',
      demographics: s.demographics || {},
      enrollment_info: s.enrollment_info || {},
      engagement: s.engagement || { clicks: 0, active_days: 0, resources_viewed: 0 },
      performance_timeline: s.performance_timeline || [],
      confidence: s.confidence !== undefined ? s.confidence : 0.80,
      feedback: s.feedback || '',
      trend: s.trend || 'stable' // Placeholder pending multi-sync historical data
    }));

    return res.json({
      totalCohort,
      atRiskRate,
      distribution,
      students: studentList
    });



  } catch (error) {
    console.error('Error fetching teacher dashboard overview:', error);
    return res.status(500).json({ message: 'Server error fetching teacher overview.' });
  }
});

module.exports = router;



