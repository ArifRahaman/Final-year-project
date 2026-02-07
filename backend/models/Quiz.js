// ==========================================
// 1. UPDATED QUIZ SCHEMA
// ==========================================
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true }
}, { _id: true }); // Each question gets an ID

const AttemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: [{ 
      questionId: mongoose.Schema.Types.ObjectId, 
      selectedIndex: Number 
  }],
  score: Number, // Percentage
  submittedAt: { type: Date, default: Date.now }
});

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questions: [QuestionSchema],
  published: { type: Boolean, default: false },
  timeLimitMinutes: Number,
  allowMultipleAttempts: { type: Boolean, default: false },
  attempts: [AttemptSchema] // ⭐ RESULT STORAGE (Embedded)
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);