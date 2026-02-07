import express from "express";
import authMiddleware from "../utils/middleware.js";
import { 
    getAssignments, 
    createAssignment, 
    deleteAssignment 
} from "../controllers/assignmentController.js";

const router = express.Router();


router.get("/", getAssignments);


router.post("/", authMiddleware, createAssignment);
router.delete("/:id", authMiddleware, deleteAssignment);

export default router;