import mongoose from "mongoose";
import fs from "fs";
import Course from "../models/Course.js"; 
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

// -------------------------------------------------------------------------
// 1. PUBLIC & GENERAL ROUTES
// -------------------------------------------------------------------------

// @desc    Get All Courses (Public)
// @route   GET /api/courses
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate({ path: "teacher", select: "name email" })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get Single Course by ID
// @route   GET /api/courses/:id


// ... other functions ...

// @desc    Get Single Course by ID
// @route   GET /api/courses/:id
export const getCourseById = async (req, res) => {
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
};
// Alias for compatibility if you use this name in routes
export const getSingleCourse = getCourseById;


// -------------------------------------------------------------------------
// 2. TEACHER ROUTES (Create, Delete, Manage)
// -------------------------------------------------------------------------

// @desc    Get Teacher's Created Courses
// @route   GET /api/courses/teacher
export const getTeacherCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id }); // Changed .id to ._id for consistency
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Create a new Course
// @route   POST /api/courses
export const createCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) return res.status(400).json({ message: "Title and description required" });

    const course = await Course.create({
      title,
      description,
      teacher: req.user._id,
      pdfFiles: []
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a Course
// @route   DELETE /api/courses/:id
export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: "Course not found" });

        if (course.teacher.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: "Course deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};


// -------------------------------------------------------------------------
// 3. STUDENT ROUTES (Enrollment Logic)
// -------------------------------------------------------------------------

// @desc    Get courses the logged-in user is enrolled in
// @route   GET /api/courses/enrolled
export const getEnrolledCourses = async (req, res) => {
  console.log("-----------------------------------------");
  console.log("🔵 ROUTE HIT: /api/courses/enrolled");
  
  try {
    if (!req.user) {
        console.error("❌ ERROR: req.user is undefined!");
        return res.status(401).json({ message: "User not authenticated" });
    }
    console.log("✅ User identified:", req.user.email);

    const courses = await Course.find({
      enrolledStudents: req.user._id
    }).populate("teacher", "name email");

    console.log(`✅ Success! Found ${courses.length} courses.`);
    res.json(courses);

  } catch (error) {
    console.error("🔥 CRITICAL BACKEND ERROR 🔥", error); 
    res.status(500).json({ message: "Server Error fetching courses", error: error.message });
  }
};

// @desc    Student requests to enroll
// @route   POST /api/courses/:id/enroll
export const enrollInCourse = async (req, res) => {
  try {
    // Handle both parameter names just in case (id or courseId)
    const courseId = req.params.id || req.params.courseId;
    const studentId = req.user._id;

    console.log("Enroll request by student:", studentId, "for course:", courseId);

    const course = await Course.findById(courseId).populate("teacher", "name email");
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Initialize requests array if missing
    if (!course.enrollRequests) course.enrollRequests = [];

    // Check duplicates
    const alreadyRequested = course.enrollRequests.some((r) => r.student.toString() === studentId.toString());
    const alreadyEnrolled = course.enrolledStudents?.includes(studentId);

    if (alreadyRequested) return res.json({ success: true, message: "Request already sent" });
    if (alreadyEnrolled) return res.json({ success: true, message: "Already enrolled" });

    // Add to requests
    course.enrollRequests.push({ student: studentId });
    await course.save();

    // EMAIL NOTIFICATION
    const student = await User.findById(studentId).select("name email");
    const dashboardLink = `${process.env.FRONTEND_URL}/teacher/courses/${courseId}/requests`;
    
    const subject = `New enrollment request: ${course.title}`;
    const textBody = `Hello ${course.teacher.name}, ${student.name} requested access. Approve here: ${dashboardLink}`;
    const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>New Student Request 👨‍🎓</h2>
        <p><strong>${student.name}</strong> has requested access to <strong>${course.title}</strong></p>
        <a href="${dashboardLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a>
      </div>
    `;

    // Attempt to send email (non-blocking)
    try {
        await sendEmail(course.teacher.email, subject, textBody, htmlBody);
    } catch (emailErr) {
        console.log("Email failed to send:", emailErr.message);
    }

    return res.json({ success: true, message: "Request sent to teacher" });

  } catch (err) {
    console.error("Enroll error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
// Alias for compatibility
export const enrollStudent = enrollInCourse;


// -------------------------------------------------------------------------
// 4. APPROVAL LOGIC (Teacher)
// -------------------------------------------------------------------------

// @desc    Approve a student
// @route   PATCH /api/courses/:courseId/approve/:studentId
export const approveStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const teacherId = req.user._id.toString();

    console.log(`🔵 Approve: Course ${courseId}, Student ${studentId}`);

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (!course.enrollRequests) course.enrollRequests = [];
    if (!course.enrolledStudents) course.enrolledStudents = [];

    const reqIndex = course.enrollRequests.findIndex((r) => {
        const currentId = r.student ? r.student.toString() : "MISSING_ID";
        return currentId === studentId.toString();
    });

    if (reqIndex === -1) {
       // Graceful fail if they are already enrolled
       const isAlreadyEnrolled = course.enrolledStudents.some((id) => id.toString() === studentId.toString());
       if (isAlreadyEnrolled) return res.json({ success: true, message: "Student is already enrolled" });
       return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Move Student
    course.enrollRequests.splice(reqIndex, 1); 
    const alreadyEnrolled = course.enrolledStudents.some((id) => id.toString() === studentId.toString());
    if (!alreadyEnrolled) course.enrolledStudents.push(studentId);

    course.markModified("enrollRequests");
    course.markModified("enrolledStudents");
    await course.save();

    console.log("✅ Student Approved");

    // Notify Student
    const student = await User.findById(studentId).select("name email");
    if (student) {
      sendEmail(student.email, `Welcome to ${course.title}!`, `Your request has been approved!`).catch(e => console.error(e));
    }

    return res.json({ success: true, message: "Student approved successfully" });

  } catch (err) {
    console.error("Approve Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


// -------------------------------------------------------------------------
// 5. UPLOAD HANDLING (PDF & Video)
// -------------------------------------------------------------------------

// @desc    Upload PDF
// @route   POST /api/courses/:id/upload
export const uploadCoursePdf = async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "Please upload a file" });

      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ message: "Course not found" });

      course.pdfFiles.push({
        fileName: file.originalname,
        filePath: file.path, 
        fileSize: file.size,
      });
      await course.save();
      res.status(200).json({ message: "PDF uploaded", course });
    } catch (err) {
      res.status(500).json({ message: "Upload failed", error: err.message });
    }
};

// @desc    Upload Video
// @route   POST /api/courses/:id/upload-video
export const uploadCourseVideo = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!req.file) return res.status(400).json({ message: "No video file uploaded" });

    course.videoFiles.push({ fileName: req.file.originalname, filePath: req.file.path });
    await course.save();
    res.json({ message: "Video uploaded successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete Video
// @route   DELETE /api/courses/:id/videos/:videoId
export const deleteCourseVideo = async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ message: "Course not found" });

      if (course.teacher.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });

      const video = course.videoFiles.id(req.params.videoId);
      if (!video) return res.status(404).json({ message: "Video not found" });

      if (fs.existsSync(video.filePath)) fs.unlinkSync(video.filePath);

      course.videoFiles.pull(req.params.videoId);
      await course.save();
      res.json({ message: "Video deleted successfully", course });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
};

