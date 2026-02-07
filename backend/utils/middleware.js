import jwt from "jsonwebtoken";
import User from "../models/User.js"; // Note: .js extension is required now

const authMiddleware = async (req, res, next) => {
  try {

    if (!req.headers.authorization) {
      return res.status(401).json({ message: "NEW ERROR: No Authorization Header sent" });
    }

    // 2. Extract token
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "NEW ERROR: Header exists but Token is missing" });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Find user
    req.user = await User.findById(decoded.id).select("_id name email");

    if (!req.user) {
      return res.status(401).json({ message: "NEW ERROR: User not found in DB" });
    }

    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(401).json({ message: "NEW ERROR: Invalid Token", error: err.message });
  }
};

export default authMiddleware;
