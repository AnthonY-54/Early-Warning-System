const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');

// Middleware to enforce teacher role
const requireTeacher = (req, res, next) => {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Access denied. Teacher privileges required.' });
  }
  next();
};

// POST /api/notes — Create a new private teacher note
router.post('/', auth, requireTeacher, async (req, res) => {
  try {
    const { student_id, text } = req.body;

    if (!student_id || !text || !text.trim()) {
      return res.status(400).json({ message: 'Student ID and note text are required.' });
    }

    // Derive teacher_id strictly from JWT token (never trust body inputs)
    const teacher_id = req.user.id;

    const newNote = await Note.create({
      student_id,
      teacher_id,
      text: text.trim()
    });

    return res.status(201).json(newNote);
  } catch (error) {
    console.error('Error creating note:', error);
    return res.status(500).json({ message: 'Server error creating note.' });
  }
});

// GET /api/notes/:student_id — Fetch private notes for student written by authenticated teacher
router.get('/:student_id', auth, requireTeacher, async (req, res) => {
  try {
    const { student_id } = req.params;
    // Derive teacher_id strictly from JWT token to enforce privacy
    const teacher_id = req.user.id;

    const notes = await Note.find({ student_id, teacher_id })
      .sort({ createdAt: -1 });

    return res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return res.status(500).json({ message: 'Server error fetching notes.' });
  }
});

module.exports = router;
