const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fileUrl: { type: String, required: true }, // Cloudinary URL
  fileName: { type: String, required: true }, // Original filename
  publicId: String, // Cloudinary Public ID (useful for deletion)
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Submission", SubmissionSchema);