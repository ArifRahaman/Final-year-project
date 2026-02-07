import React from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

export default function GoogleLoginButton() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      const res = await axios.post(
        "http://localhost:5000/api/auth/google",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.setItem("token", res.data.token);

      enqueueSnackbar("Google login successful ✅", { variant: "success" });

      if (res.data.user.role === "student") {
        navigate("/student/dashboard");
      } else {
        navigate("/teacher/dashboard");
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Google login failed ❌", { variant: "error" });
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex items-center gap-3 px-6 py-3 border rounded-xl hover:bg-gray-50"
    >
      Continue with Google
    </button>
  );
}
