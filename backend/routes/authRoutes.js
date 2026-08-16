const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const VALID_TEACHER_IDS = require('../data/validTeacherIds');
const FAKE_LMS_DATA = require('../data/fakeLmsData.json');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, teacherId, studentId } = req.body;

    // Basic required fields validation
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required.' });
    }

    // Role validation
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either student or teacher.' });
    }

    // Password length validation
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    let formattedStudentId = null;

    // Teacher ID validation for teachers
    if (role === 'teacher') {
      if (!teacherId || !VALID_TEACHER_IDS.includes(teacherId.trim())) {
        return res.status(400).json({ message: 'Invalid or missing Teacher ID.' });
      }
    }

    // Student ID validation for students
    if (role === 'student') {
      if (!studentId || typeof studentId !== 'string') {
        return res.status(400).json({ message: 'Student ID is required.' });
      }

      formattedStudentId = studentId.trim().toUpperCase();

      // Format validation: S followed by 3 digits (e.g. S101)
      const studentIdRegex = /^S\d{3}$/;
      if (!studentIdRegex.test(formattedStudentId)) {
        return res.status(400).json({ message: 'Student ID must be formatted as S followed by 3 digits (e.g., S101).' });
      }

      // LMS existence validation
      const lmsRecord = FAKE_LMS_DATA.find(s => s.student_id === formattedStudentId);
      if (!lmsRecord) {
        return res.status(400).json({ message: 'Student ID not recognized.' });
      }
    }

    // Check email uniqueness
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = new User({
      email: normalizedEmail,
      password: hashedPassword,
      role,
      teacherId: role === 'teacher' ? teacherId.trim() : null,
      studentId: role === 'student' ? formattedStudentId : null
    });

    await newUser.save();

    // Perform one-time sync step from Fake LMS to MongoDB Student collection if student
    if (role === 'student' && formattedStudentId) {
      const lmsRecord = FAKE_LMS_DATA.find(s => s.student_id === formattedStudentId);
      if (lmsRecord) {
        // Phase 3 Analytics Computation (Sync Time)
        // 1. Calculate placeholder probability from latest performance timeline score
        // NOTE: This is a deliberate placeholder standing in for a real ML model (trained on student marks/features)
        // that exists outside this project's scope and is not integrated here.
        const timeline = lmsRecord.performance_timeline || [];
        const latestEntry = timeline.length > 0 ? timeline[timeline.length - 1] : null;
        const latestScore = latestEntry ? latestEntry.score : 70;
        
        const hasActivity = lmsRecord.engagement && lmsRecord.engagement.active_days > 0;
        
        let probability = 0;
        if (hasActivity) {
          // Clamp calculated fail probability between 0 and 1
          probability = Math.max(0, Math.min(1, (100 - latestScore) / 100));
        }

        // 2. Evaluate risk using existing service logic
        const riskLevel = evaluateRisk(probability, hasActivity);

        // 3. Fixed constant confidence placeholder (0.80 / 80%) pending real model integration
        const confidenceConstant = 0.80;

        // 4. Generate feedback text using existing service logic
        const feedbackText = generateFeedback(riskLevel, confidenceConstant, { weakTopic: lmsRecord.weakTopic });

        // 5. Save all synced and analytical fields to Student document in MongoDB
        await Student.findOneAndUpdate(
          { student_id: formattedStudentId },
          {
            student_id: lmsRecord.student_id,
            name: lmsRecord.name,
            course: lmsRecord.course,
            stage: lmsRecord.stage,
            engagement: lmsRecord.engagement,
            weakTopic: lmsRecord.weakTopic,
            performance_timeline: lmsRecord.performance_timeline,
            probability,
            risk_level: riskLevel,
            confidence: confidenceConstant,
            feedback: feedbackText,
            trend: 'stable' // Placeholder pending multi-sync historical data
          },
          { upsert: true, new: true }
        );
      }
    }


    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        teacherId: newUser.teacherId,
        studentId: newUser.studentId
      }
    });

  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Specific error message as per spec (3.4)
    if (!user) {
      return res.status(400).json({ message: 'Email not found' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // Generate JWT token (expires in 2h)
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
    const token = jwt.sign(
      { id: user._id, role: user.role },
      secret,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        teacherId: user.teacherId,
        studentId: user.studentId
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;

