const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // --- Identity ---
  student_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },

  // --- OULAD static/demographic fields (flat, mirrors StudentInput 1:1) ---
  code_module: String,
  code_presentation: String,
  gender: String,
  region: String,
  highest_education: String,
  imd_band: String,
  age_band: String,
  studied_credits: Number,
  disability: String,
  is_repeat: Number,          // 0 or 1
  registration_lag: Number,

  // --- App-facing / display fields ---
  course: String,              // human-readable label shown in UI (e.g. "Data Mining 101")
  stage: {
    type: String,
    enum: ['20%', '40%', '60%', '80%', '100%']
  },
  weakTopic: String,

  // --- Per-milestone academic + behavioral history ---
  milestones: [
    {
      stage: {
        type: String,
        enum: ['20%', '40%', '60%', '80%', '100%']
      },
      assessment_score: Number,    // maps to StudentInput.assessment_score (AS)
      days_late: Number,           // maps to StudentInput.days_late (LS)
      total_clicks: Number,        // maps to StudentInput.total_clicks (SC)
      active_days: Number,         // maps to StudentInput.active_days (AD)
      resources_accessed: Number,  // maps to StudentInput.resources_accessed (AR)

      // Prediction results for this milestone
      probability: Number,
      risk_level: {
        type: String,
        enum: ['Green', 'Yellow', 'Red', 'Black']
      },
      confidence: Number,
      top_reasons: [
        {
          feature: String,
          reason: String,
          impact: Number
        }
      ]
    }
  ],

  enrollment_info: {
    status: { type: String, enum: ['Active', 'Withdrawn'], default: 'Active' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
