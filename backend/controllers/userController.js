import User from "../models/User.js";

// @desc    Get current logged-in user's profile
// @route   GET /api/users/me
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    // req.user is already fetched by the authMiddleware
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(req.user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get specific user by ID (e.g., viewing a teacher's profile)
// @route   GET /api/users/:id
// @access  Public or Private
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password"); // Exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server Error" });
  }
};