const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // 👇 1. THIS IS THE FIX: Add 'default: []'
    enrollRequests: {
      type: [
        {
          student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          requestedAt: { type: Date, default: Date.now }
        }
      ],
      default: [] // <--- This forces the empty array to exist in the DB
    },

    // 👇 2. SAME HERE
    enrolledStudents: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [] // <--- This forces the empty array to exist in the DB
    },

    pdfFiles: [
      {
        fileName: String,
        filePath: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    videoFiles: [
      {
        fileName: String,
        filePath: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
