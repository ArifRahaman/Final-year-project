const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  options: {
    type: [String],
    validate: { validator: (v) => v.length >= 2 && v.length <= 6, message: 'Options must be 2–6' }
  },
  correctIndex: { type: Number, required: true, min: 0 }
}, { _id: true });

const attemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{ type: Number }],
  score: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
}, { _id: true });

const quizSchema = new mongoose.Schema({
  card: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true, unique: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, default: '' },
  questions: [questionSchema],
  attempts: [attemptSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

quizSchema.index({ card: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
