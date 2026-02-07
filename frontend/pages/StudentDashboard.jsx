import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useSnackbar } from "notistack";

/* -------------------------- Keep the same helper -------------------------- */
function getUserIdFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return localStorage.getItem("userId") || null;
    // Decode JWT without validation (only to extract sub/user id if present)
    const parts = token.split(".");
    if (parts.length < 2) return localStorage.getItem("userId") || null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    // Common claim names: sub, userId, id, _id
    return payload.sub || payload.userId || payload.id || payload._id || localStorage.getItem("userId") || null;
  } catch (e) {
    return localStorage.getItem("userId") || null;
  }
}

/* -------------------------- Main Component -------------------------- */
export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null); // courseId being requested
  const { enqueueSnackbar } = useSnackbar();

  // derived once per render
  const currentUserId = useMemo(() => getUserIdFromToken(), []);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) setFiltered(courses);
    else
      setFiltered(
        courses.filter(
          (c) =>
            (c.title || "").toLowerCase().includes(q) ||
            (c.teacherName || "").toLowerCase().includes(q)
        )
      );
  }, [query, courses]);

  async function fetchCourses() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/courses", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // normalize response to an array
      const coursesArray = Array.isArray(res.data) ? res.data : res.data.data || [];

      // map/populate teacherName and ensure arrays exist
      const normalized = coursesArray.map((c) => ({
        ...c,
        teacherName:
          (c.teacher && (c.teacher.name || c.teacher.email || (typeof c.teacher === "string" ? c.teacher : null))) ||
          c.teacherName ||
          "Unknown",
        enrollRequests: Array.isArray(c.enrollRequests) ? c.enrollRequests : (c.enrollRequests || []),
        enrolledStudents: Array.isArray(c.enrolledStudents) ? c.enrolledStudents : (c.enrolledStudents || []),
      }));

      setCourses(normalized);
      setFiltered(normalized);
    } catch (err) {
      console.error("fetchCourses error", err);
      enqueueSnackbar(err?.response?.data?.message || "Failed to load courses", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll(courseId) {
    try {
      setEnrolling(courseId);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/enroll`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      enqueueSnackbar(res.data?.message || "Request sent to teacher", {
        variant: "success",
      });

      // update local course state: add a pending request for current user
      setCourses((prev) =>
        prev.map((c) => {
          if (c._id !== courseId) return c;
          // if already requested, return as-is
          const alreadyReq = (c.enrollRequests || []).some((r) => {
            const rid = r?.student?.toString?.() ?? r?.student;
            return rid === currentUserId;
          });
          if (alreadyReq) return c;
          const newReq = { student: currentUserId, approved: false, requestedAt: new Date().toISOString() };
          return { ...c, enrollRequests: [...(c.enrollRequests || []), newReq] };
        })
      );
    } catch (err) {
      console.error("enroll error", err);
      enqueueSnackbar(err?.response?.data?.message || "Request failed", {
        variant: "error",
      });
    } finally {
      setEnrolling(null);
    }
  }

  // helper to check states
  function deriveCourseState(course) {
    const uid = currentUserId?.toString?.() ?? currentUserId;
    const enrolled = (course.enrolledStudents || []).some((s) => {
      const sid = s?.toString?.() ?? s;
      return sid === uid;
    });
    const req = (course.enrollRequests || []).find((r) => {
      const rid = r?.student?.toString?.() ?? r?.student;
      return rid === uid;
    });
    const pending = !!req && !req.approved;
    const approvedRequest = !!req && !!req.approved;
    return { enrolled, pending, approvedRequest };
  }

  /* -------------------------- UI -------------------------- */

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">Available Courses</h2>
            <p className="text-sm text-gray-500">Browse courses you can request access to</p>
          </div>

          <div className="w-full sm:w-80">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or teacher..."
              className="w-full px-3 py-2 border rounded-md bg-white text-sm"
            />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          </div>
        ) : !Array.isArray(filtered) || filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No courses found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map((course) => {
              const { enrolled, pending } = deriveCourseState(course);

              return (
                <motion.div
                  key={course._id}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="cursor-pointer"
                >
                  <div className="bg-white rounded-lg shadow-sm border flex flex-col h-full">
                    <div className="p-4 flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="flex items-center justify-center rounded-full text-white font-bold"
                          style={{ backgroundColor: "#3b82f6", width: 48, height: 48 }}
                        >
                          {course.title?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div className="flex-1">
                          <div className="text-lg font-semibold text-gray-800">{course.title}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {course.shortDescription || (course.description ? `${course.description.slice(0, 80)}...` : "")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded">{course.category || "General"}</span>
                        <div className="text-xs text-gray-500 ml-2">By {course.teacherName || "Unknown"}</div>
                      </div>

                      <div className="mt-4 text-sm text-gray-600">
                        Seats: {course.capacity ?? "∞"} • Enrolled: {course.studentsCount ?? (course.enrolledStudents?.length ?? 0)}
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between border-t">
                      <button
                        onClick={() => handleEnroll(course._id)}
                        disabled={enrolled || pending || enrolling === course._id}
                        className={`px-3 py-2 rounded-md text-sm font-semibold ${enrolled ? "bg-white border" : "bg-blue-600 text-white"} ${ (pending || enrolling===course._id) ? "opacity-70 cursor-not-allowed" : "" }`}
                      >
                        {enrolling === course._id
                          ? "Requesting..."
                          : enrolled
                          ? "Enrolled"
                          : pending
                          ? "Requested"
                          : "Request Access"}
                      </button>

                      <button
                        onClick={() => {
                          window.alert(`${course.title}\n\n${course.description || "No description."}`);
                        }}
                        className="text-sm px-3 py-2 rounded-md border bg-white"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
