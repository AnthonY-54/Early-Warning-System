const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: true,
    index: true
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Composite index for efficient private per (student, teacher) queries
NoteSchema.index({ student_id: 1, teacher_id: 1, createdAt: -1 });

module.exports = mongoose.model('Note', NoteSchema);
