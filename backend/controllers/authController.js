import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const signup = async (req, res) => {
  try {
    let { name, email, password, role } = req.body || {};
    if (!name || !email || !password || !role) return res.status(400).json({ message: "All fields are required" });

    email = String(email).trim().toLowerCase();
    if (!isValidEmail(email)) return res.status(400).json({ message: "Invalid email" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, role });

    const token = jwt.sign({ id: newUser._id.toString(), role: newUser.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ message: "User created", token, user: { id: newUser._id, name: newUser.name, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
