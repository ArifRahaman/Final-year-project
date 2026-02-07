import express from "express";
import { getUserProfile, getUserById } from "../controllers/userController.js";
import authMiddleware from "../utils/middleware.js"; // ⚠️ Check your middleware path

const router = express.Router();


router.get("/me", authMiddleware, getUserProfile);

router.get("/:id", getUserById);

export default router;