// src/pages/Login.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { motion } from "framer-motion";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Github } from "lucide-react";

// --- AUTH IMPORTS ---
import { useAuth } from "../context/AuthContext";
import { auth, googleProvider } from "./firebase"; // Ensure path is correct (e.g. ./firebase or ../firebase)
import { signInWithPopup } from "firebase/auth";

/* ---------------- Validation ---------------- */
const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function Login() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Get the login function from context to update state immediately
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Used for manual login loading

  // --- 1. MANUAL LOGIN HANDLER ---
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        data
      );

      // Save token
      localStorage.setItem("token", res.data.token);

      // Update Context
      login(res.data.user, res.data.user.role);

      enqueueSnackbar("Login successful ✅", { variant: "success" });

      if (res.data.user.role === "student") {
        navigate("/student/dashboard");
      } else {
        navigate("/teacher/dashboard");
      }
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || "Invalid credentials",
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  // --- 2. GOOGLE LOGIN HANDLER ---
  const handleGoogleLogin = async () => {
    try {
      // A. Trigger Popup
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // B. Get Token
      const token = await firebaseUser.getIdToken();

      // C. Send to Backend
      const res = await axios.post(
        "http://localhost:5000/api/auth/google",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`, // Pass token explicitly
          },
        }
      );

      // D. Save Token
      localStorage.setItem("token", res.data.token);

      // E. Update Context IMMEDIATELY (Fixes the redirect bug)
      login(res.data.user, res.data.user.role);

      enqueueSnackbar("Google login successful ✅", { variant: "success" });

      // F. Navigate
      if (res.data.user.role === "student") {
        navigate("/student/dashboard");
      } else {
        navigate("/teacher/dashboard");
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      enqueueSnackbar(
        error?.response?.data?.message || "Google login failed ❌",
        { variant: "error" }
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-50 via-white to-slate-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* LEFT PANEL */}
          <div className="hidden md:flex flex-col justify-between p-8 text-white bg-gradient-to-br from-indigo-600 to-violet-600">
            <div>
              <h2 className="text-3xl font-bold">Welcome back 👋</h2>
              <p className="mt-2 text-indigo-100">
                Login to continue to your dashboard
              </p>
            </div>

            {/* Image */}
            <div
              className="mt-6 h-52 rounded-xl bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://marvel-b1-cdn.bc0a.com/f00000000290162/images.ctfassets.net/2htm8llflwdx/5u2aV3rSMUUwTsf6hyfx5F/b8a0330066d3891c658b890b42425e1a/Shorelight_Education_Majors.jpg')",
              }}
            />

            <ul className="mt-6 text-sm text-indigo-100 list-disc pl-5 space-y-1">
              <li>Use institute email for student access</li>
              <li>Keep credentials secure</li>
              <li>Contact admin if locked out</li>
            </ul>
          </div>

          {/* RIGHT PANEL */}
          <div className="p-6 md:p-10">
            <h3 className="text-2xl font-semibold">Sign in</h3>
            <p className="text-sm text-gray-500 mb-6">
              Enter your credentials to continue
            </p>

            {/* Social buttons */}
            <div className="flex gap-2 mb-6">
              {/* GOOGLE BUTTON */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </button>

                {/* GitHub Button */}
                <button
                  type="button"
                  onClick={() =>
                    enqueueSnackbar("GitHub login not implemented", { variant: "info" })
                  }
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <Github size={20} className="text-gray-900" />
                  GitHub
                </button>
              </div>

              {/* GITHUB BUTTON (Placeholder) */}

            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Email */}
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="Email address"
                  className={`w-full rounded-xl border py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-300 outline-none ${errors.email ? "border-red-300" : "border-gray-200"
                    }`}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Password"
                  className={`w-full rounded-xl border py-3 pl-11 pr-12 focus:ring-2 focus:ring-indigo-300 outline-none ${errors.password ? "border-red-300" : "border-gray-200"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-indigo-600" />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-indigo-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:shadow-lg disabled:opacity-70"
              >
                {isSubmitting || loading ? "Logging in..." : "Sign in"}
              </motion.button>

              <p className="text-center text-sm text-gray-500">
                Don’t have an account?{" "}
                <span
                  onClick={() => navigate("/signup")}
                  className="text-indigo-600 font-medium cursor-pointer"
                >
                  Create one
                </span>
              </p>
            </form>

            <p className="mt-6 text-xs text-gray-400 text-center">
              By signing in you agree to our{" "}
              <span className="underline">Terms</span> &{" "}
              <span className="underline">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}