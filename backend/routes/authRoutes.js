const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const VALID_TEACHER_IDS = require('../data/validTeacherIds');
const FAKE_LMS_DATA = require('../data/fakeLmsData.json');
const { evaluateRisk } = require('../services/riskEvaluationService');
const { predictMilestones } = require('../services/mlPredictionService');

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
        // Run ML model predictions (or graceful placeholder fallback) sequentially per milestone
        const milestones = await predictMilestones(lmsRecord);

        // Save all new OULAD fields, display fields, and milestones to Student document in MongoDB
        await Student.findOneAndUpdate(
          { student_id: formattedStudentId },
          {
            student_id: lmsRecord.student_id,
            name: lmsRecord.name,
            code_module: lmsRecord.code_module,
            code_presentation: lmsRecord.code_presentation,
            gender: lmsRecord.gender,
            region: lmsRecord.region,
            highest_education: lmsRecord.highest_education,
            imd_band: lmsRecord.imd_band,
            age_band: lmsRecord.age_band,
            studied_credits: lmsRecord.studied_credits,
            disability: lmsRecord.disability,
            is_repeat: lmsRecord.is_repeat,
            registration_lag: lmsRecord.registration_lag,
            course: lmsRecord.course,
            stage: lmsRecord.stage,
            weakTopic: lmsRecord.weakTopic,
            milestones,
            enrollment_info: lmsRecord.enrollment_info || { status: 'Active' }
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

