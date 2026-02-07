// import React, { useEffect } from "react";
// import { AppBar, Toolbar, Button, Typography } from "@mui/material";
// import { NavLink, useNavigate } from "react-router-dom";

// export default function Navbar() {
//   const navigate = useNavigate();

//   const role = localStorage.getItem("role"); // student | teacher
//   const user = JSON.parse(localStorage.getItem("user"));

//   // 🔐 Redirect if auth is broken
//   useEffect(() => {
//     if (role && !user) {
//       localStorage.clear();
//       navigate("/signup", { replace: true });
//     }
//   }, [role, user, navigate]);

//   const handleLogout = () => {
//     localStorage.clear();
//     navigate("/login");
//   };

//   return (
//     <AppBar position="static" color="default" elevation={1}>
//       <Toolbar className="flex justify-between">
//         {/* Brand */}
//         <Typography
//           variant="h6"
//           fontWeight="bold"
//           className="cursor-pointer"
//           onClick={() => {
//             if (role === "student") navigate("/student/dashboard");
//             else if (role === "teacher") navigate("/teacher/dashboard");
//             else navigate("/");
//           }}
//         >
//           EduPortal
//         </Typography>

//         {/* Navigation */}
//         <div className="flex gap-3 items-center">
//           {!role && (
//             <>
//               <NavLink to="/login">
//                 <Button>Login</Button>
//               </NavLink>
//               <NavLink to="/signup">
//                 <Button variant="contained">Signup</Button>
//               </NavLink>
//             </>
//           )}

//           {role === "student" && (
//             <>
//               <NavLink to="/student/dashboard">
//                 <Button>Dashboard</Button>
//               </NavLink>
//               <NavLink to="/student/explorecourses">
//                 <Button>Explore Courses</Button>
//               </NavLink>
//               <NavLink to="/student/profile">
//                 <Button>Profile</Button>
//               </NavLink>
//             </>
//           )}

//           {role === "teacher" && (
//             <NavLink to="/teacher/dashboard">
//               <Button>Dashboard</Button>
//             </NavLink>
//           )}

//           {role && user && (
//             <>
//               <Typography variant="body2" className="mx-2">
//                 Hi, {user.name}
//               </Typography>
//               <Button variant="outlined" color="error" onClick={handleLogout}>
//                 Logout
//               </Button>
//             </>
//           )}
//         </div>
//       </Toolbar>
//     </AppBar>
//   );
// }

import React from "react";
import { AppBar, Toolbar, Button, Typography } from "@mui/material";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; 

export default function Navbar() {
  const navigate = useNavigate();
  
  // 1. FIX: Do not destructure 'role' here. It doesn't exist separately.
  const { user, logout } = useAuth(); 

  // 2. Helper to get role safely
  const role = user?.role; 

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar className="flex justify-between">
        {/* Brand */}
        <Typography
          variant="h6"
          fontWeight="bold"
          className="cursor-pointer"
          onClick={() => {
            if (role === "student") navigate("/student/dashboard");
            else if (role === "teacher") navigate("/teacher/dashboard");
            else navigate("/");
          }}
        >
          EduPortal
        </Typography>

        {/* Navigation Logic */}
        <div className="flex gap-3 items-center">
          {/* If NOT logged in */}
          {!user && (
            <>
              <NavLink to="/login">
                <Button>Login</Button>
              </NavLink>
              <NavLink to="/signup">
                <Button variant="contained">Signup</Button>
              </NavLink>
            </>
          )}

          {/* If Student - FIX: Check user exists AND role matches */}
          {user && role === "student" && (
            <>
              <NavLink to="/student/dashboard">
                <Button>Dashboard</Button>
              </NavLink>
              <NavLink to="/student/explorecourses">
                <Button>Explore Courses</Button>
              </NavLink>
              <NavLink to="/student/papers">
                <Button>Previous Year papers</Button>
              </NavLink>
              <NavLink to="/student/profile">
                <Button>Profile</Button>
              </NavLink>
            </>
          )}

          {/* If Teacher */}
          {user && role === "teacher" && (
            <NavLink to="/teacher/dashboard">
              <Button>Dashboard</Button>
            </NavLink>
          )}

          {/* Logout Button */}
          {user && (
            <>
              <Typography variant="body2" className="mx-2">
                Hi, {user.name || user.email}
              </Typography>
              <Button variant="outlined" color="error" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
}