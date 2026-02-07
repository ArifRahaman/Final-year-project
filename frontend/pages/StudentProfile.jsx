import React, { useEffect, useState } from "react";
import {
  Avatar,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  CircularProgress
} from "@mui/material";
import { motion } from "framer-motion";
import axios from "axios";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Retrieve token once
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      try {
        // ---------------------------------------------------------
        // 1️⃣ STEP 1: Fetch User Profile
        // ---------------------------------------------------------
        console.log("📡 Fetching User Profile...");
        const userRes = await axios.get("http://localhost:5000/api/users/me", { headers });
        console.log("✅ User Data Received:", userRes.data);
        setUser(userRes.data);

        // ---------------------------------------------------------
        // 2️⃣ STEP 2: Fetch Enrolled Courses (Separately)
        // ---------------------------------------------------------
        try {
          console.log("📡 Fetching Courses...");
          const coursesRes = await axios.get("http://localhost:5000/api/courses/enrolled", { headers });
          console.log("✅ Courses Data Received:", coursesRes.data);

          // Handle different data structures safely
          if (Array.isArray(coursesRes.data)) {
            setCourses(coursesRes.data);
          } else if (coursesRes.data.courses && Array.isArray(coursesRes.data.courses)) {
            setCourses(coursesRes.data.courses);
          } else if (coursesRes.data.enrolledCourses && Array.isArray(coursesRes.data.enrolledCourses)) {
            setCourses(coursesRes.data.enrolledCourses);
          } else {
            console.warn("⚠️ Unexpected courses format:", coursesRes.data);
            setCourses([]);
          }
        } catch (courseError) {
          console.error("❌ Error fetching courses (User is still loaded):", courseError);
          // We do NOT stop the page here. We just show 0 courses.
        }

      } catch (userError) {
        console.error("❌ Critical Error fetching user:", userError);
        // If user fails, we can't show the profile
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-red-500">
        <Typography variant="h6">Failed to load profile.</Typography>
        <Typography variant="body2">Check console for details.</Typography>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        {/* PROFILE CARD */}
        <Card className="rounded-2xl shadow-lg mb-6">
          <CardContent className="flex flex-col md:flex-row items-center gap-6">
            <Avatar sx={{ width: 90, height: 90 }} className="bg-blue-600 text-3xl">
              {user.name?.charAt(0) || "?"}
            </Avatar>

            <div className="flex-1">
              <Typography variant="h5" fontWeight="700">
                {user.name}
              </Typography>

              <Typography color="text.secondary">
                {user.email}
              </Typography>

              {user.university && (
                <Typography className="mt-1">
                  🎓 {user.university}
                </Typography>
              )}

              <div className="mt-2">
                <Chip
                  label={(user.role || "student").toUpperCase()}
                  color={user.role === "teacher" ? "secondary" : "primary"}
                  size="small"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ENROLLED COURSES */}
        <Card className="rounded-2xl shadow-lg">
          <CardContent>
            <Typography variant="h6" fontWeight="700" gutterBottom>
              Enrolled Courses
            </Typography>

            <Divider className="mb-4" />

            {courses.length === 0 ? (
              <Typography color="text.secondary">
                You are not enrolled in any courses yet (or failed to load).
              </Typography>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <motion.div key={course._id} whileHover={{ scale: 1.03 }}>
                    <Card className="rounded-xl shadow-sm border">
                      <CardContent>
                        <Typography fontWeight="600">
                          {course.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Instructor: {course.teacher?.name || "N/A"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
