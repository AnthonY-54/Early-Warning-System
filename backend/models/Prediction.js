const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  student_id: { type: String, required: true, ref: 'Student' },
  stage: { type: String, enum: ['20%', '40%', '60%', '80%', '100%'], required: true },
  probability: { type: Number, required: true },
  risk_level: { type: String, enum: ['Green', 'Yellow', 'Red', 'Black'], required: true },
  confidence: { type: Number, required: true }
}, { timestamps: true });

// Ensure one prediction per stage per student
predictionSchema.index({ student_id: 1, stage: 1 }, { unique: true });

module.exports = mongoose.model('Prediction', predictionSchema);
