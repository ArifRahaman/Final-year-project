// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { auth } from "../pages/firebase"; 
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1. Initialize user from localStorage if available (for manual login persistence)
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(true);

  // 2. Set default axios header if we have a token already
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  // 3. Firebase Listener (Handles Google Login + Auto-Refresh for Google Users)
  useEffect(() => {
    let mounted = true;

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      // If we already have a user (manual login), we might not want to overwrite 
      // unless it's definitely a Firebase event. 
      // However, usually, if a user is logged in manually, firebaseUser is null.
      
      if (firebaseUser) {
        setLoading(true);
        try {
          const idToken = await firebaseUser.getIdToken();
          axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;

          // Sync with backend
          const res = await axios.post("http://localhost:5000/api/auth/google", {}, {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          // Save User & Token
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          
          if (mounted) setUser(res.data.user);
        } catch (err) {
          console.error("Google Auth Sync Error:", err);
          // Don't necessarily logout here if manual login is active, 
          // but for safety in a mixed env, we usually clear if validation fails.
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        // Firebase says "No User". 
        // If we currently have a user in state that is *NOT* from Firebase (manual),
        // we should NOT clear it here.
        // But since we can't easily distinguish, we rely on the manual logout.
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // 4. Manual Login Function (Called by Login.jsx)
  const login = (userData, role) => {
    // Determine the user object (merge role if needed)
    const finalUser = { ...userData, role: role || userData.role };
    
    setUser(finalUser);
    localStorage.setItem("user", JSON.stringify(finalUser));
    
    // Note: Token is usually set inside Login.jsx, but we can ensure headers are set
    const token = localStorage.getItem("token");
    if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  };

  // 5. Universal Logout (Clears both Firebase and Local State)
  const logout = async () => {
    try {
      await signOut(auth); // Sign out of Firebase
    } catch (err) {
      console.warn("Firebase signOut failed (might be manual user):", err);
    }
    
    // Clear Local Storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    
    // Clear State
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;