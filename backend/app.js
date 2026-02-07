import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import admin from "firebase-admin";
import { createRequire } from "module"; 
import { summarizeVideo } from "./controllers/Summarize.js";

const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Course from "./models/Course.js";
// Keep your existing User model import
import User from "./models/User.js";
import Assignment from "./models/Assignmentschema.js";
dotenv.config();
// const streamifier = require("streamifier")
import streamifier from 'streamifier';

// import cloudinary from "cloudinary";
import { v2 as cloudinary } from 'cloudinary';

import Submission from "./models/SubmissionSchema.js";
// const Course = require("./models/Course.js"); // path to your Course model file
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
// const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");



import { CloudinaryStorage } from "multer-storage-cloudinary";
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import sendEmail from "./utils/sendEmail.js";
import authMiddleware from "./utils/middleware.js";

import Quiz from "./models/Quiz.js";
// -----------------
// Middleware
// -----------------
app.use(cors());
app.use(express.json());

// Serve "uploads" folder so frontend can open PDFs
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -----------------
// MongoDB connection
// -----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.error("MongoDB connection error:", err));

  // --- Cloudinary Config ---
cloudinary.config({
  cloud_name: "dpt0cbqxm",
  api_key: "962218246438834",
  api_secret: "vW5CsyHgep555dovQGm0KDwA5v8"
});

// Configure Multer to use Cloudinary
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "lms_assignments", // Folder name in Cloudinary
    resource_type: "raw", // 'raw' allows PDF, DOCX, ZIP, etc.
    allowed_formats: ["pdf", "doc", "docx", "zip", "png", "jpg"]
  },
});

const uploadCloudinary = multer({ storage: cloudinaryStorage });

// -----------------
// MODELS
// -----------------

// Logic Fix: Course Model needs pdfFiles array
// const courseSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   studentsCount: { type: Number, default: 0 },
//   category: { type: String, default: "General" },
//   createdAt: { type: Date, default: Date.now },
//   // This array stores the uploaded PDFs
//   pdfFiles: [
//     {
//       fileName: String,
//       filePath: String,
//       uploadedAt: { type: Date, default: Date.now },
//     },
//   ],
// });

// Prevent model overwrite error
// const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);
// -----------------
// Multer Config (File Upload Logic)
// -----------------
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === "application/pdf") {
//     cb(null, true);
//   } else {
//     cb(new Error("Only PDF files are allowed!"), false);
//   }
// };

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter
// });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow PDF
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  }
  // Allow Video files
  else if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  }
  // Reject others
  else {
    cb(
      new Error("Only PDF and video files are allowed!"),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB (videos need more)
  },
  fileFilter,
});

// -----------------
// Auth Middleware
// -----------------
const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
// app.use("/api/courses", courseRoutes);

// Any request to /api/assignments/... goes to assignmentRoutes
app.use("/api/assignments", assignmentRoutes);

// Any request to /api/users/... goes to userRoutes
app.use("/api/users", userRoutes);
app.post("/api/summarize", upload.single("video"), summarizeVideo);

// -----------------
// AUTH ROUTES (Unchanged)
// -----------------

// function isValidEmail(email) {
//   return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// }

// app.post("/api/auth/signup", async (req, res) => {
//   try {
//     let { name, email, password, role } = req.body || {};
//     if (!name || !email || !password || !role) return res.status(400).json({ message: "All fields are required" });

//     email = String(email).trim().toLowerCase();
//     if (!isValidEmail(email)) return res.status(400).json({ message: "Invalid email" });

//     const existingUser = await User.findOne({ email });
//     if (existingUser) return res.status(400).json({ message: "Email already registered" });

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = await User.create({ name, email, password: hashedPassword, role });

//     const token = jwt.sign({ id: newUser._id.toString(), role: newUser.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

//     res.status(201).json({ message: "User created", token, user: { id: newUser._id, name: newUser.name, role: newUser.role } });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// app.post("/api/auth/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email: String(email).toLowerCase() });

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

//     res.status(200).json({ token, user: { id: user._id, name: user.name, role: user.role } });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// -----------------
// COURSE ROUTES (Logic Updated)
// -----------------



// 1. Create Assignment (Teacher)
app.post("/api/assignments", authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ message: "Unauthorized" });
    const assignment = new Assignment({ ...req.body, createdBy: req.user.id });
    await assignment.save();
    res.status(201).json(assignment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Get All Assignments for a Course
app.get("/api/assignments", authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.query;
    // Get assignments and check if the current student has already submitted
    const assignments = await Assignment.find({ courseId }).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. STUDENT: Submit Assignment (Upload to Cloudinary)
app.post("/api/assignments/:id/submit", authMiddleware, uploadCloudinary.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Check if already submitted (Optional: remove if you want to allow re-submissions)
    const existing = await Submission.findOne({ 
        assignmentId: req.params.id, 
        studentId: req.user.id 
    });
    if (existing) {
        return res.status(400).json({ message: "You have already submitted this assignment." });
    }

    const submission = new Submission({
      assignmentId: req.params.id,
      studentId: req.user.id,
      fileUrl: req.file.path, // Cloudinary URL
      fileName: req.file.originalname,
      publicId: req.file.filename
    });

    await submission.save();
    res.json({ message: "Assignment submitted successfully!", submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// --- ADD THIS TO YOUR ASSIGNMENT ROUTES SECTION ---

// 5. STUDENT: Get My Submissions for a Course (To check status)
app.get("/api/my-submissions", authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.query;
    const studentId = req.user.id;

    // 1. Find all assignments belonging to this course
    const courseAssignments = await Assignment.find({ courseId }).select('_id');
    const assignmentIds = courseAssignments.map(a => a._id);

    // 2. Find submissions by this student for those specific assignments
    const submissions = await Submission.find({
      studentId: studentId,
      assignmentId: { $in: assignmentIds }
    });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 4. TEACHER: Get All Submissions for a specific Assignment
app.get("/api/assignments/:id/submissions", authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ message: "Unauthorized" });

    const submissions = await Submission.find({ assignmentId: req.params.id })
      .populate("studentId", "name username email") // Get student details
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1. GET Teacher's Courses
// Route: /api/courses/teacher (Keep same name)
app.get("/api/courses/teacher", protect, async (req, res) => {
  try {
    // Logic: Find courses where 'teacher' matches logged-in user ID
    const courses = await Course.find({ teacher: req.user.id });
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 2. CREATE Course
// Route: /api/courses (Keep same name)
app.post("/api/courses", protect, async (req, res) => {
  try {
    const { title, description } = req.body;

    // 1. Validate Input
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description required" });
    }

    // 🔍 Debug: See what user data we have
    console.log("Creating course for user:", req.user);

    // 2. Validate User (Safety check)
    if (!req.user || (!req.user._id && !req.user.id)) {
      return res.status(401).json({ message: "User not authenticated properly" });
    }

    // 3. Create Course
    const course = await Course.create({
      title,
      description,
      // 👇 FIX IS HERE: Use _id first, fallback to id
      teacher: req.user._id || req.user.id,

      // Arrays are handled by Schema defaults now, 
      // but passing empty arrays explicitly is also fine.
      pdfFiles: []
    });

    res.status(201).json(course);

  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



// 3. DELETE Course
// Route: /api/courses/:id (Matches your frontend axios.delete)
app.delete("/api/courses/:id", protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Logic: Ensure only the owner can delete
    if (course.teacher.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 4. GET Single Course (Needed for the "Enter" page)
// Route: /api/courses/:id
// app.get("/api/courses/:id", protect, async (req, res) => {
//     try {
//         const course = await Course.findById(req.params.id);
//         if (!course) return res.status(404).json({ message: "Course not found" });
//         res.json(course);
//     } catch (err) {
//         res.status(500).json({ message: "Server Error" });
//     }
// });

// 5. UPLOAD PDF (New Logic)
// Route: /api/courses/:id/upload

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storagepdf = multer.memoryStorage();
const uploadpdf = multer({
  storagepdf,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit (adjust as needed)
});
function uploadBufferToCloudinary(buffer, filename, folder = "courses_pdfs") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // important for PDFs
        folder,
        public_id: filename ? filename.replace(/\.[^/.]+$/, "") : undefined,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}
app.post(
  "/api/courses/:id/upload",
  protect,
  uploadpdf.single("pdf"),
  async (req, res) => {
    try {
      const courseId = req.params.id;
      const file = req.file;

      if (!file) return res.status(400).json({ message: "Please upload a file" });

      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });

      // Upload buffer to Cloudinary
      const cldResult = await uploadBufferToCloudinary(file.buffer, file.originalname);

      const newPdf = {
        fileName: file.originalname,
        filePath: cldResult.secure_url, // Cloudinary URL
        publicId: cldResult.public_id,  // useful if you later want to delete
        uploadedAt: new Date(),
      };

      course.pdfFiles.push(newPdf);
      await course.save();

      res.status(200).json({ message: "PDF uploaded", course });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed", error: err.message });
    }
  }
);
app.get('/api/assignments', async (req, res) => {
  try {
    const { courseId } = req.query;

    // If a courseId is passed, filter by it. Otherwise, return all.
    const query = courseId ? { courseId } : {};

    const assignments = await Assignment.find(query).sort({ dueDate: 1 });
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error fetching assignments" });
  }
});

// 2. CREATE Assignment
app.post('/api/assignments', async (req, res) => {
  try {
    const { courseId, title, description, dueDate } = req.body;

    // Basic Validation
    if (!courseId || !title || !dueDate) {
      return res.status(400).json({ error: "Missing required fields (courseId, title, dueDate)" });
    }

    const newAssignment = new Assignment({
      courseId,
      title,
      description,
      dueDate
    });

    const savedAssignment = await newAssignment.save();
    res.status(201).json(savedAssignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error creating assignment" });
  }
});
// const Course = require("../models/Course"); // path to your Course model file

// GET /api/courses
app.get('/api/courses', async (req, res) => {
  try {
    // find all courses. populate teacher with name/email if you have those fields.
    const courses = await Course.find()
      .populate({ path: "teacher", select: "name email" }) // optional
      .sort({ createdAt: -1 });

    res.json({ success: true, data: courses });
  } catch (err) {
    console.error("getCourses error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// app.patch("/api/courses/:courseId/approve/:studentId", async (req, res) => {
//    try {
//     const courseId = req.params.id;
//     const studentId = req.user._id; // assume auth middleware sets req.user
//     const course = await Course.findById(courseId).populate("teacher", "name email");

//     if (!course) return res.status(404).json({ success: false, message: "Course not found" });

//     // already enrolled?
//     if (course.enrolledStudents.some((s) => s.toString() === studentId.toString())) {
//       return res.status(400).json({ success: false, message: "Already enrolled" });
//     }

//     // already requested?
//     const existing = course.enrollRequests.find(
//       (r) => r.student.toString() === studentId.toString()
//     );
//     if (existing) {
//       return res.status(200).json({ success: true, message: "Request already pending" });
//     }

//     // add request
//     course.enrollRequests.push({ student: studentId });
//     await course.save();

//     // send email to teacher
//     const teacher = course.teacher;
//     const student = await User.findById(studentId).select("name email");
//     const approveLink = `${process.env.FRONTEND_URL}/teacher/courses/${course._id}/requests`;
//     const mailSubject = `New enrollment request for "${course.title}"`;
//     const mailBody = `
//       Hello ${teacher.name || "Instructor"},

//       ${student.name} (${student.email}) has requested access to your course "${course.title}".

//       To approve or reject this request, visit: ${approveLink}

//       -- Your App
//     `;

//     await sendEmail(teacher.email, mailSubject, mailBody);

//     return res.json({ success: true, message: "Enrollment request sent to teacher" });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// });
// app.patch("/api/courses/:courseId/approve/:studentId", authMiddleware, async (req, res) => {
//   try {
//     const { courseId, studentId } = req.params;
//     const userId = req.user._id; // The person clicking "Approve" (The Teacher)

//     // 1. Find the course
//     const course = await Course.findById(courseId).populate("teacher", "name email");

//     if (!course) {
//       return res.status(404).json({ success: false, message: "Course not found" });
//     }

//     // 2. SECURITY CHECK: Only the teacher can approve requests
//     if (course.teacher._id.toString() !== userId.toString()) {
//       return res.status(403).json({ success: false, message: "Not authorized to approve requests for this course" });
//     }

//     // 3. Find the student in the request list
//     // (We use .id or ._id depending on your schema, assuming subdocument array)
//     const requestIndex = course.enrollRequests.findIndex(
//       (r) => r.student.toString() === studentId
//     );

//     if (requestIndex === -1) {
//       return res.status(404).json({ success: false, message: "Enrollment request not found" });
//     }

//     // 4. Move Student: Remove from Requests -> Add to Enrolled
//     course.enrollRequests.splice(requestIndex, 1); // Remove

//     // Check if already in enrolled (double safety)
//     if (!course.enrolledStudents.includes(studentId)) {
//         course.enrolledStudents.push(studentId); // Add
//     }

//     await course.save();

//     // 5. Notify the Student
//     const student = await User.findById(studentId).select("name email");

//     if (student) {
//         const subject = `Enrollment Approved: ${course.title}`;
//         const body = `
//         Hi ${student.name},

//         Great news! Your request to join "${course.title}" has been approved.

//         You can now access the course content here:
//         ${process.env.FRONTEND_URL}/courses/${courseId}/learn

//         Happy Learning!
//         `;

//         await sendEmail(student.email, subject, body);
//     }

//     return res.json({ 
//         success: true, 
//         message: "Student approved and notified" 
//     });

//   } catch (err) {
//     console.error("❌ Approval Error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// });

app.post(
  "/api/courses/:id/enroll",
  authMiddleware,
  async (req, res) => {
    try {
      console.log("CONNECTED DB:", mongoose.connection.name);
      console.log("MONGO URI:", process.env.MONGO_URI);

      const courseId = req.params.id;
      const studentId = req.user._id;
      console.log("Enroll request by student:", studentId, "for course:", courseId);

      const course = await Course.findById(courseId).populate("teacher", "name email");

      if (!course) return res.status(404).json({ message: "Course not found" });

      // 1. Initialize requests array if missing
      if (!course.enrollRequests) course.enrollRequests = [];

      // 2. Check duplicates
      const alreadyRequested = course.enrollRequests.some(
        (r) => r.student.toString() === studentId.toString()
      );
      if (alreadyRequested) return res.json({ success: true, message: "Request already sent" });
      const alreadyEnrolled = course.enrolledStudents?.includes(studentId);
      if (alreadyEnrolled) return res.json({ success: true, message: "Already enrolled" });

      course.enrollRequests.push({ student: studentId });
      console.log("Before save:", course.enrollRequests);
      const saved = await course.save();
      console.log("Saved enrollRequests:", saved.enrollRequests);


      // 4. PREPARE EMAIL DATA
      const student = await User.findById(studentId).select("name email");

      // 👇 THIS IS THE MISSING LINK 👇
      const dashboardLink = `${process.env.FRONTEND_URL}/teacher/courses/${courseId}/requests`;

      // 5. Create Email Body (Plain Text + HTML)
      const subject = `New enrollment request: ${course.title}`;

      // Plain text version (for backup)
      const textBody = `
Hello ${course.teacher.name},
${student.name} (${student.email}) has requested access to: ${course.title}.
Approve here: ${dashboardLink}
    `;

      // HTML Version (The pretty one with the button)
      const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>New Student Request 👨‍🎓</h2>
        <p>Hello <strong>${course.teacher.name}</strong>,</p>
        <p><strong>${student.name}</strong> (${student.email}) has requested access to your course:</p>
        <p style="font-size: 18px; color: #333;">📘 <strong>${course.title}</strong></p>
        
        <br/>
        
        <a href="${dashboardLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Review Request
        </a>

        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          If the button doesn't work, copy this link:<br/>
          ${dashboardLink}
        </p>
      </div>
    `;

      // 6. SEND EMAIL (Pass both text and html)
      await sendEmail(
        course.teacher.email,
        subject,
        textBody, // Argument 3: Text
        htmlBody  // Argument 4: HTML
      );

      return res.json({ success: true, message: "Request sent to teacher" });

    } catch (err) {
      console.error("Enroll error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);
// // PATCH: /api/courses/:courseId/approve/:studentId
// // Approve Route (Move from Waiting List -> Enrolled List)
// // Approve Route (Move from Waiting List -> Enrolled List)
// // Approve Route (Move from Waiting List -> Enrolled List)
app.patch("/api/courses/:courseId/approve/:studentId", authMiddleware, async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const teacherId = req.user._id.toString();

    console.log(`\n🔵 DEBUG START: Approve Student`);
    console.log(`👉 CourseID: ${courseId}`);
    console.log(`👉 StudentID (to approve): ${studentId}`);

    // 1. Fetch Course
    const course = await Course.findById(courseId);
    if (!course) {
      console.log("❌ Course not found in DB");
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // 2. Authorize Teacher
    if (course.teacher.toString() !== teacherId) {
      console.log(`❌ Auth Failed. Course Teacher: ${course.teacher}, Requester: ${teacherId}`);
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // 3. FORCE Initialize Arrays (Bypassing potential Schema strictness)
    // This ensures we never get "cannot read properties of undefined"
    if (!course.enrollRequests) course.enrollRequests = [];
    if (!course.enrolledStudents) course.enrolledStudents = [];

    // 🔍 DEEP INSPECTION LOG
    console.log("📂 Current Waiting List (Raw):", JSON.stringify(course.enrollRequests, null, 2));

    // 4. Find the Request (With extra safety checks)
    const reqIndex = course.enrollRequests.findIndex((r) => {
      // Log every item we check to see why it fails
      const currentId = r.student ? r.student.toString() : "MISSING_ID";
      const isMatch = currentId === studentId.toString();
      // console.log(`   checking: ${currentId} === ${studentId} ? ${isMatch}`); // Uncomment for extreme detail
      return isMatch;
    });

    if (reqIndex === -1) {
      console.log("❌ Match Failed: Student ID not found in enrollRequests array.");

      // Check if already enrolled to be nice
      const isAlreadyEnrolled = course.enrolledStudents.some(
        (id) => id.toString() === studentId.toString()
      );

      if (isAlreadyEnrolled) {
        console.log("⚠️ Student was already inside enrolledStudents list.");
        return res.json({ success: true, message: "Student is already enrolled" });
      }
      return res.status(404).json({ success: false, message: "Request not found in waiting list" });
    }

    console.log(`✅ Match Found at Index: ${reqIndex}`);

    // 5. MOVE: Remove from Request List -> Add to Enrolled List
    course.enrollRequests.splice(reqIndex, 1);

    // Add to Enrolled List (if not already there)
    const alreadyEnrolled = course.enrolledStudents.some(
      (id) => id.toString() === studentId.toString()
    );
    if (!alreadyEnrolled) {
      course.enrolledStudents.push(studentId);
    }

    // 6. Save Changes
    course.markModified("enrollRequests");
    course.markModified("enrolledStudents");

    await course.save();
    console.log("💾 Database Updated Successfully");

    // 7. Notify Student (Async)
    const student = await User.findById(studentId).select("name email");
    if (student) {
      const subject = `Welcome to ${course.title}! 🎓`;
      const text = `Hi ${student.name},\n\nYour request to join "${course.title}" has been approved!`;

      sendEmail(student.email, subject, text).catch(err =>
        console.error("⚠️ Email failed (non-fatal):", err.message)
      );
    }

    return res.json({ success: true, message: "Student approved successfully" });

  } catch (err) {
    console.error("❌ CRITICAL SERVER ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


// ==========================================
// QUIZ API ROUTES (Updated)
// ==========================================

// 1. Create Quiz (Teacher)
app.post("/api/quizzes", authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ message: "Only teachers can create quizzes" });
    
    const { courseId, title, description, questions, timeLimitMinutes, published, allowMultipleAttempts } = req.body;
    
    const quiz = new Quiz({
      courseId,
      title,
      description,
      questions,
      timeLimitMinutes,
      published,
      allowMultipleAttempts,
      createdBy: req.user.id
    });
    
    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Quizzes for a Course
app.get("/api/quizzes", authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.query;
    const query = { courseId };
    
    // If student, only show published quizzes
    if (req.user.role === 'student') {
        query.published = true;
    }

    // Exclude attempts array from the list view to save bandwidth
    const quizzes = await Quiz.find(query)
        .select("-attempts") 
        .sort({ createdAt: -1 });
        
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Single Quiz Details
app.get("/api/quizzes/:id", authMiddleware, async (req, res) => {
  try {
    // ⭐ CHANGE "fullName" TO "name" HERE:
    const quiz = await Quiz.findById(req.params.id)
      .populate("attempts.student", "name username"); 

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (req.user.role === 'student') {
        const quizObj = quiz.toObject();
        quizObj.questions.forEach(q => delete q.correctIndex);
        delete quizObj.attempts;
        return res.json(quizObj);
    }
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Submit Quiz (UPDATED for Embedded Schema)
app.post("/api/quizzes/:id/submit", authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body; // { questionId: selectedIndex }
    const quizId = req.params.id;
    const studentId = req.user.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check Multiple Attempts Logic
    if (!quiz.allowMultipleAttempts) {
        const alreadyAttempted = quiz.attempts.some(
            (attempt) => attempt.student.toString() === studentId
        );
        if (alreadyAttempted) {
            return res.status(400).json({ message: "You have already taken this quiz." });
        }
    }

    // Calculate Score
    let correctCount = 0;
    const recordedAnswers = [];

    quiz.questions.forEach((q) => {
        const qIdStr = q._id.toString();
        const submittedIndex = answers[qIdStr];
        
        // Record the answer
        recordedAnswers.push({
            questionId: q._id,
            selectedIndex: submittedIndex
        });

        // Check correctness
        if (submittedIndex !== undefined && submittedIndex === q.correctIndex) {
            correctCount++;
        }
    });

    const totalQuestions = quiz.questions.length;
    const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Create Attempt Object
    const newAttempt = {
        student: studentId,
        answers: recordedAnswers,
        score: scorePercentage,
        submittedAt: new Date()
    };

    // Push to Quiz attempts array and save
    quiz.attempts.push(newAttempt);
    await quiz.save();

    res.json({ 
        message: "Quiz Submitted Successfully", 
        score: scorePercentage, 
        correctCount, 
        totalQuestions 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Get My Results (Student specific)
app.get("/api/quizzes/:id/my-result", authMiddleware, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        // Find attempts by this student
        const myAttempts = quiz.attempts.filter(a => a.student.toString() === req.user.id);
        
        res.json(myAttempts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post("/:id/enroll", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user._id;

    // Populate teacher to get their email
    const course = await Course.findById(courseId).populate("teacher", "name email");

    if (!course) return res.status(404).json({ message: "Course not found" });

    // Initialize array if undefined
    if (!course.enrollRequests) course.enrollRequests = [];

    // Check if already requested
    const alreadyRequested = course.enrollRequests.some(
      (r) => r.student.toString() === studentId.toString()
    );

    // Check if already enrolled
    const alreadyEnrolled = course.enrolledStudents?.includes(studentId);

    if (alreadyRequested || alreadyEnrolled) {
      return res.json({ success: true, message: "Request already sent or enrolled" });
    }

    // Add request
    course.enrollRequests.push({ student: studentId });
    await course.save();

    // Notify Teacher
    const student = await User.findById(studentId).select("name email");
    const dashboardLink = `${process.env.FRONTEND_URL}/teacher/courses/${courseId}/requests`;

    const htmlBody = `
      <h3>New Enrollment Request 👨‍🎓</h3>
      <p><strong>${student.name}</strong> (${student.email}) wants to join <strong>${course.title}</strong>.</p>
      <p><a href="${dashboardLink}" style="background:#007bff;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;">Review Request</a></p>
    `;

    await sendEmail(course.teacher.email, `New Request: ${course.title}`, "New student request", htmlBody);

    return res.json({ success: true, message: "Request sent to teacher" });

  } catch (err) {
    console.error("Enroll Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});
// Make sure you have this import at the top of app.js
// const Course = require("./models/course");

app.get("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("teacher", "name email")
      .populate({
        path: "enrollRequests.student",
        select: "name email"
      });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Safety check: Ensure arrays exist
    const courseData = course.toObject();
    if (!courseData.enrollRequests) courseData.enrollRequests = [];
    if (!courseData.enrolledStudents) courseData.enrolledStudents = [];

    res.json(courseData);

  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// --- Multer for Videos ---
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    // Save with unique name: video-timestamp.mp4
    cb(null, `video-${Date.now()}-${file.originalname}`);
  },
});

const fileFilterVideo = (req, file, cb) => {
  if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Not a video! Please upload a video file."), false);
  }
};

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: fileFilterVideo,
  limits: { fileSize: 500 * 1024 * 1024 } // Limit: 500MB (Adjust if needed)
});
// ------------------------------------------
// 🎥 VIDEO ROUTES
// ------------------------------------------

// 1. Upload Video
app.post(
  "/api/courses/:id/upload-video",
  authMiddleware,
  uploadVideo.single("video"), // Matches frontend formData.append("video", ...)
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ message: "Course not found" });

      if (course.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No video file uploaded" });
      }

      // Add to videoFiles array
      course.videoFiles.push({
        fileName: req.file.originalname,
        filePath: req.file.path,
      });

      await course.save();
      res.json({ message: "Video uploaded successfully", course });

    } catch (error) {
      console.error("Video Upload Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// 2. Delete Video
// app.delete(
//   "/api/courses/:id/videos/:videoId",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const course = await Course.findById(req.params.id);
//       if (!course) return res.status(404).json({ message: "Course not found" });

//       if (course.teacher.toString() !== req.user._id.toString()) {
//         return res.status(403).json({ message: "Not authorized" });
//       }

//       // Find the video
//       const video = course.videoFiles.id(req.params.videoId);
//       if (!video) {
//         return res.status(404).json({ message: "Video not found" });
//       }// Inside app.post("/api/courses/:id/upload-video", ...)

// // const course = await Course.findById(req.params.id);
// if (!course) return res.status(404).json({ message: "Course not found" });

// // 👇 ADD THESE LOGS 👇
// console.log("👮 Video Upload Auth Check:");
// console.log("   Current User ID:", req.user._id.toString());
// console.log("   Course Owner ID:", course.teacher.toString());

// if (course.teacher.toString() !== req.user._id.toString()) {
//   console.log("❌ ACCESS DENIED: IDs do not match.");
//   return res.status(403).json({ message: "Not authorized" });
// }


//       // Delete file from server storage
//       const fs = require("fs");
//       if (fs.existsSync(video.filePath)) {
//         fs.unlinkSync(video.filePath);
//       }

//       // Remove from Database using .pull()
//       course.videoFiles.pull(req.params.videoId);
//       await course.save();

//       res.json({ message: "Video deleted successfully", course });

//     } catch (error) {
//       console.error("Delete Video Error:", error);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// app.get("/api/courses/enrolled", authMiddleware, async (req, res) => {
//   console.log("-----------------------------------------");
//   console.log("🔵 ROUTE HIT: /api/courses/enrolled");

//   try {
//     // 🔍 Debug 1: Check User
//     if (!req.user) {
//         console.error("❌ ERROR: req.user is undefined!");
//         return res.status(401).json({ message: "User not authenticated" });
//     }
//     console.log("✅ User identified:", req.user.email);
//     console.log("🔍 Searching for courses with Student ID:", req.user._id);

//     // 🔍 Debug 2: Run Query
//     const courses = await Course.find({
//       enrolledStudents: req.user._id
//     }).populate("teacher", "name email");

//     console.log(`✅ Success! Found ${courses.length} courses.`);
//     res.json(courses);

//   } catch (error) {
//     // 🔍 Debug 3: THE REAL ERROR
//     console.error("🔥 CRITICAL BACKEND ERROR 🔥");
//     console.error(error); // <--- THIS prints the specific reason to your terminal

//     res.status(500).json({ 
//         message: "Server Error fetching courses", 
//         error: error.message 
//     });
//   }
// });

// 3. Get Single Quiz (Updated with Population)
// 3. Get Single Quiz (Updated to fix "Unknown Student")
app.get("/api/quizzes/:id", authMiddleware, async (req, res) => {
  try {
    // ⭐ THIS LINE IS THE FIX: 
    // It tells Mongoose: "Look at the 'attempts' array, find the 'student' field, 
    // and replace the ID with the actual User document (only get fullName and username)."
    const quiz = await Quiz.findById(req.params.id)
      .populate("attempts.student", "fullName username"); 

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Privacy Check: Hide sensitive data for students
    if (req.user.role === 'student') {
        const quizObj = quiz.toObject();
        quizObj.questions.forEach(q => delete q.correctIndex); // Hide answers
        delete quizObj.attempts; // Hide other students' results
        return res.json(quizObj);
    }

    // Teacher receives full data including student names populated above
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/auth/google", async (req, res) => {
  try {
    // 1. Check if header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Error: Missing Authorization header");
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    // 2. LOG THE TOKEN (First 10 chars to verify it arrived)
    console.log("Verifying Firebase Token:", token.substring(0, 10) + "...");

    // 3. Verify with Firebase Admin
    const decoded = await admin.auth().verifyIdToken(token);
    console.log("Token Verified! User:", decoded.email);

    const { email, name, picture, uid } = decoded;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || "User",
        email,
        googleId: uid,
        role: "student", 
        // Add default password if your schema requires it, or make it optional
      });
    }

    const appToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token: appToken,
      user,
    });

  } catch (err) {
    // 4. PRINT THE ACTUAL ERROR TO THE CONSOLE
    console.error("GOOGLE AUTH ERROR:", err.message); 
    console.error("Full Error:", err); // This helps debug "Project ID Mismatch"

    res.status(401).json({ 
      message: "Google authentication failed", 
      error: err.message // Send specific error to frontend for now
    });
  }
});

app.get("/api/users/me", authMiddleware, async (req, res) => {
  return res.json(req.user);
});
app.use("/api/auth", authRoutes);

// -----------------
// Start server
// -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT} 🚀`)
);