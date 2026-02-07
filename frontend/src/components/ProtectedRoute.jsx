import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  // 1. Get ONLY 'user' from context. 
  // (The role is inside user.role, not a separate variable)
  const { user } = useAuth();

  // 2. If user is not logged in, redirect to Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Check role inside the user object
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized users to home or a "not authorized" page
    return <Navigate to="/" replace />; 
  }

  // 4. If authenticated and authorized, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;