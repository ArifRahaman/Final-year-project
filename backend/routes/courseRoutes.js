import express from "express";
import authMiddleware from "../utils/middleware.js"; // Ensure .js extension is here
import {
  getEnrolledCourses,
  getCourseById,
  enrollInCourse,
  approveStudent
} from "../controllers/courseController.js"; // Ensure .js extension is here

const router = express.Router();


router.get("/enrolled", authMiddleware, getEnrolledCourses);


router.post("/:id/enroll", authMiddleware, enrollInCourse);


router.patch("/:courseId/approve/:studentId", authMiddleware, approveStudent);


router.get("/:id", getCourseById);

export default router;
