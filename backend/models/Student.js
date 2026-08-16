const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  student_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  course: { type: String },
  stage: { 
    type: String, 
    enum: ['20%', '40%', '60%', '80%', '100%'] 
  },
  demographics: {
    age_band: String,
    education: String,
    imd_band: String,
  },
  enrollment_info: {
    module: String,
    presentation: String,
    status: { type: String, enum: ['Active', 'Withdrawn'], default: 'Active' }
  },
  engagement: {
    clicks: { type: Number, default: 0 },
    active_days: { type: Number, default: 0 },
    resources_viewed: { type: Number, default: 0 }
  },
  weakTopic: { type: String },
  performance_timeline: [
    {
      stage: String,
      score: Number,
      risk: String
    }
  ],
  // Phase 3 Analytics fields
  probability: { type: Number, default: 0 },
  risk_level: { 
    type: String, 
    enum: ['Green', 'Yellow', 'Red', 'Black'],
    default: 'Green'
  },
  confidence: { type: Number, default: 0.80 },
  feedback: { type: String },
  trend: { type: String, default: 'stable' }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);


