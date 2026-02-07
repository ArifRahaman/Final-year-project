import Assignment from "../models/Assignmentschema.js"; // ⚠️ Check your filename (Assignmentschema vs Assignment)
import Course from "../models/Course.js";

// @desc    Get all assignments (Optional: Filter by ?courseId=...)
// @route   GET /api/assignments
export const getAssignments = async (req, res) => {
  try {
    const { courseId } = req.query;

    // Build query: If courseId is provided, filter by it. Otherwise get all.
    const query = courseId ? { courseId } : {};

    const assignments = await Assignment.find(query).sort({ dueDate: 1 });
    res.json(assignments);
  } catch (err) {
    console.error("Get Assignments Error:", err);
    res.status(500).json({ message: "Server Error fetching assignments" });
  }
};

// @desc    Create a new assignment
// @route   POST /api/assignments
export const createAssignment = async (req, res) => {
  try {
    const { courseId, title, description, dueDate } = req.body;

    // 1. Validation
    if (!courseId || !title || !dueDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 2. Fetch Course to check ownership
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 3. SECURITY CHECK: Only the Course Teacher can add assignments
    if (course.teacher.toString() !== req.user.id && course.teacher.toString() !== req.user._id) {
        return res.status(403).json({ message: "Not authorized to add assignments to this course" });
    }

    // 4. Create Assignment
    const newAssignment = await Assignment.create({
      courseId,
      title,
      description,
      dueDate
    });

    res.status(201).json(newAssignment);
  } catch (err) {
    console.error("Create Assignment Error:", err);
    res.status(500).json({ message: "Server Error creating assignment" });
  }
};

// @desc    Delete an assignment
// @route   DELETE /api/assignments/:id
export const deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });

        // Security: Check if user owns the course this assignment belongs to
        const course = await Course.findById(assignment.courseId);
        
        if (course && course.teacher.toString() !== req.user.id) {
             return res.status(403).json({ message: "Not authorized" });
        }

        await Assignment.findByIdAndDelete(req.params.id);
        res.json({ message: "Assignment deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
}
