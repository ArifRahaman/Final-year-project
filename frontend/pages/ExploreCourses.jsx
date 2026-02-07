import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  User as PersonIcon,
  Lock as LockIcon,
  Unlock as LockOpenIcon,
  FileText as PdfIcon,
  Video as VideoIcon,
  ArrowRight as ArrowIcon,
} from "lucide-react";

/* ------------------------- Helpers (same logic) ------------------------- */

function getUserIdFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return localStorage.getItem("userId") || null;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(base64));
    return payload.id || payload._id || payload.userId || payload.sub || localStorage.getItem("userId");
  } catch (e) {
    return localStorage.getItem("userId") || null;
  }
}

function getCodeFromTitle(title) {
  if (!title) return "N/A";
  const trimmed = title.trim();
  if (trimmed.length <= 4) return trimmed.toUpperCase();
  const words = trimmed.split(/[\s/&,-]+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  const initials = words.map((w) => w[0]).join("").toUpperCase();
  return initials.slice(0, 3);
}

/* ------------------------- Component ------------------------- */

export default function ExploreCourses() {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const currentUserId = useMemo(() => getUserIdFromToken(), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchCourses() {
      setLoading(true);
      setError(null);
      try {
        const resp = await axios.get("http://localhost:5000/api/courses");
        if (cancelled) return;
        const data = Array.isArray(resp.data) ? resp.data : resp.data?.data || [];
        setCourses(data);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError("Failed to load courses");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filtering logic (same as original)
  const filteredCourses = courses.filter((course) => {
    const title = (course.title || "").toString().toLowerCase();
    const teacherName = (course.teacher?.name || "").toString().toLowerCase();
    const q = searchTerm.toLowerCase();
    return title.includes(q) || teacherName.includes(q);
  });

  // Navigation handler (same)
  const handleCardClick = (course, isEnrolled) => {
    if (isEnrolled) {
      navigate(`/courses/${course._id}`);
    } else {
      navigate("/student/dashboard");
    }
  };

  /* ------------------------- UI Render ------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
        <div className="max-w-[95%] mx-auto">
          <div className="mb-6">
            <div className="h-10 w-56 bg-gray-200 rounded-md animate-pulse" />
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-white rounded-2xl shadow-sm overflow-hidden p-6">
                <div className="h-28 bg-gray-100 rounded-lg animate-pulse" />
                <div className="mt-4 space-y-3">
                  <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                  <div className="h-12 bg-gray-100 rounded animate-pulse w-full mt-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-24 px-4">
        <div className="max-w-[95%] mx-auto text-center">
          <p className="text-red-600 text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-[95%] mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight mb-2">
              Explore <span className="text-blue-600">Subjects</span>
            </h1>
            <p className="text-gray-500 text-sm md:text-base">Find the perfect course to upgrade your skills.</p>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-full w-full md:w-[450px] shadow-sm hover:shadow-md transition-shadow"
          >
            <SearchIcon className="text-gray-400 mr-3" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses or instructors..."
              className="flex-1 outline-none text-base font-medium text-gray-700 bg-transparent"
            />
          </form>
        </div>

        {/* Grid / Empty state */}
        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="bg-blue-50 p-6 rounded-full mb-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                <path d="M12 2L12 22" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">No courses found matching "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 px-4 py-2 rounded-xl border text-sm font-medium normal-case"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
              const code = getCodeFromTitle(course.title);
              const teacherName = course.teacher?.name || "Instructor";
              const pdfCount = course.pdfFiles?.length || 0;
              const videoCount = course.videoFiles?.length || 0;

              const isEnrolled = (course.enrolledStudents || []).some((s) => {
                const sId = typeof s === "object" ? s._id : s;
                return sId?.toString() === currentUserId?.toString();
              });

              return (
                <motion.div
                  key={course._id}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="cursor-pointer"
                  onClick={() => handleCardClick(course, isEnrolled)}
                >
                  <div className="rounded-[2rem] overflow-hidden bg-white group border border-gray-100 shadow-sm flex flex-col h-full min-h-[340px]">
                    {/* Header */}
                    <div
                      className={`h-28 relative overflow-visible ${isEnrolled ? "bg-gradient-to-br from-emerald-400 to-teal-500" : "bg-gradient-to-br from-blue-600 to-indigo-600"}`}
                    >
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                      {/* Status Badge */}
                      <div className="absolute top-4 right-4 z-10">
                        <span
                          className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-white/90 ${isEnrolled ? "text-emerald-700" : "text-indigo-700"}`}
                        >
                          {isEnrolled ? <LockOpenIcon size={14} /> : <LockIcon size={14} />}
                          {isEnrolled ? "Unlocked" : "Locked"}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div
                        className="absolute -bottom-9 left-7 w-18 h-18 rounded-full bg-white flex items-center justify-center font-extrabold text-2xl"
                        style={{
                          width: 72,
                          height: 72,
                          border: "5px solid white",
                          boxShadow: "0 8px 12px -3px rgba(0,0,0,0.1)",
                          color: isEnrolled ? "#10b981" : "#4f46e5",
                        }}
                      >
                        {code}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="pt-10 px-7 pb-5 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-gray-800 leading-tight mb-1 truncate">{course.title}</h3>

                      <div className="flex items-center gap-2 mb-3 text-gray-500">
                        <PersonIcon size={16} className="text-gray-400" />
                        <span className="text-sm font-medium">{teacherName}</span>
                      </div>

                      <p className="text-gray-500 mb-5 line-clamp-2">
                        {course.description || "Master this subject with comprehensive materials and video lectures."}
                      </p>

                      {/* Stats */}
                      <div className="flex gap-2 mt-auto">
                        <div className="flex items-center text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg">
                          <PdfIcon size={14} className="mr-2 text-rose-500" />
                          {pdfCount} PDF{pdfCount !== 1 && "s"}
                        </div>
                        <div className="flex items-center text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg">
                          <VideoIcon size={14} className="mr-2 text-violet-500" />
                          {videoCount} Video{videoCount !== 1 && "s"}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className={`px-7 py-4 border-t border-gray-100 flex justify-between items-center ${isEnrolled ? "bg-emerald-50/30" : "bg-white group-hover:bg-blue-50/30"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wide ${isEnrolled ? "text-emerald-600" : "text-blue-600"}`}>
                          {isEnrolled ? "Open Course" : "Details"}
                        </span>
                      </div>

                      <div className={`p-1.5 rounded-full ${isEnrolled ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}>
                        <ArrowIcon size={16} />
                      </div>
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
