// --- Assignment Schema ---
const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // Teacher who created it
}, { timestamps: true });

module.exports = mongoose.model("Assignment", AssignmentSchema);


