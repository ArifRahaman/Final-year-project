// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import React from "react";

// // Pages
// import Login from "../pages/Login";
// import Signup from "../pages/Signup";
// import StudentDashboard from "../pages/StudentDashboard";
// import StudentProfile from "../pages/StudentProfile";
// import ExploreCourses from "../pages/ExploreCourses";
// import TeacherDashboard from "../pages/TeacherDashboard"; // Import the actual component
// import CourseDetailsPage from "../pages/CourseDetailsPage";
// import TeacherRequests from "../pages/TeacherRequest";
// import Previousyearpapers from "../pages/Previousyearpapers";
// // Components
// import QuizTakingPage from "../pages/QuizTakingPage";
// import Navbar from "./components/Navbar";
// import ProtectedRoute from "./components/ProtectedRoute";
// import { AuthProvider } from "../context/AuthContext";
// import Signupandlogin from "../pages/Signupandlogin"
// function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <Navbar />

//         <Routes>
//           {/* --- Public Routes --- */}
//           <Route path="/" element={<Login />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/signup" element={<Signup />} />

//           {/* --- Protected Routes for STUDENTS --- */}
//           <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
//             <Route path="/student/dashboard" element={<StudentDashboard />} />
//             <Route path="/student/profile" element={<StudentProfile />} />
//               <Route path="/student/papers" element={<Previousyearpapers />} />
//             <Route path="/student/explorecourses" element={<ExploreCourses />} />
// <Route path="/quiz/:quizId" element={<QuizTakingPage />} />            {/* If students also need to see course details, keep this here. 
//                 If NOT, remove it from here. */}
//              <Route path="/courses/:id" element={<CourseDetailsPage />} />
          

//           </Route>
//    <Route path="/signupandlogin" element={<Signupandlogin />} />
//           {/* --- Protected Routes for TEACHERS --- */}
//           <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
//             {/* 1. Use the actual Component, not a <div> */}
//             <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
// <Route path="/teacher/courses/:courseId/requests" element={<TeacherRequests />} />            {/* 2. ✅ FIXED: Added 's' to make it /courses/:id */}
//             {/* 3. ✅ MOVED: Added here so Teachers can access it */}
//             <Route path="/course/:id" element={<CourseDetailsPage />} />
//           </Route>

//         </Routes>
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }

// export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from "react";

// Pages
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Signupandlogin from "../pages/Signupandlogin"
import StudentDashboard from "../pages/StudentDashboard";
import StudentProfile from "../pages/StudentProfile";
import ExploreCourses from "../pages/ExploreCourses";
import TeacherDashboard from "../pages/TeacherDashboard";
import CourseDetailsPage from "../pages/CourseDetailsPage";
import TeacherRequests from "../pages/TeacherRequest";
import Previousyearpapers from "../pages/Previousyearpapers";
import QuizTakingPage from "../pages/QuizTakingPage";
import VideoUpload from "../pages/Videoupload";
// Components
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth
import { AuthProvider, useAuth } from "../context/AuthContext";

/* 🔐 Wrapper to wait for auth before rendering routes */
const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <Routes>
        {/* ---------- Public Routes ---------- */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signupandlogin" element={<Signupandlogin />} />
        <Route path="/videoupload" element={<VideoUpload />} />

        {/* ---------- Student Routes ---------- */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/papers" element={<Previousyearpapers />} />
          <Route path="/student/explorecourses" element={<ExploreCourses />} />
          <Route path="/quiz/:quizId" element={<QuizTakingPage />} />
          <Route path="/courses/:id" element={<CourseDetailsPage />} />
        </Route>

        {/* ---------- Teacher Routes ---------- */}
        <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route
            path="/teacher/courses/:courseId/requests"
            element={<TeacherRequests />}
          />
          <Route path="/course/:id" element={<CourseDetailsPage />} />
        </Route>
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
