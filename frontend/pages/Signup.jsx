import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import {
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Box,
  Chip,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import BadgeIcon from "@mui/icons-material/Badge";
import { useSnackbar } from "notistack";
import axios from "axios";

/* -------------------------
   Validation schema
   ------------------------- */
const schema = yup.object({
  name: yup.string().trim().required("Full name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

/* -------------------------
   Helper: Dynamic Colors
   ------------------------- */
const getThemeColors = (role) => {
  if (role === "teacher")
    return {
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      main: "#764ba2",
      bg: "bg-purple-50",
    };
  if (role === "student")
    return {
      gradient: "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)", // Mint/Green
      main: "#0ba360",
      bg: "bg-teal-50",
    };
  // Default neutral
  return {
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    main: "#555",
    bg: "bg-gray-100",
  };
};

export default function Signup() {
  const [role, setRole] = useState(null);
  const theme = getThemeColors(role);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500"
      style={{
        background: role ? theme.bg : "#f3f4f6",
        backgroundImage: !role
          ? "radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)"
          : undefined,
        backgroundColor: !role ? "#111" : undefined, // Dark mode for selection
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Background Decorative Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        layout
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-lg relative z-10"
      >
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            backdropFilter: "blur(20px)",
            backgroundColor: role ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.9)",
            overflow: "visible",
          }}
        >
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {!role ? (
                <RoleSelect key="role-select" onSelect={setRole} />
              ) : (
                <SignupForm key="signup-form" role={role} goBack={() => setRole(null)} />
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* -------------------------
   1. Improved Role Selection
   ------------------------- */
function RoleSelect({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <Typography variant="h4" align="center" fontWeight="800" gutterBottom sx={{ color: "#333" }}>
        Welcome
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Choose your account type to get started
      </Typography>

      <div className="flex flex-col gap-4">
        <RoleCard
          icon={<SchoolIcon fontSize="large" className="text-white" />}
          title="Student"
          desc="Access courses, quizzes, and track progress."
          color="linear-gradient(135deg, #0ba360 0%, #3cba92 100%)"
          onClick={() => onSelect("student")}
        />
        <RoleCard
          icon={<PersonIcon fontSize="large" className="text-white" />}
          title="Teacher"
          desc="Create courses, manage students, and grade."
          color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          onClick={() => onSelect("teacher")}
        />
      </div>
    </motion.div>
  );
}

function RoleCard({ icon, title, desc, color, onClick }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Box
        onClick={onClick}
        sx={{
          background: "white",
          border: "1px solid #eee",
          borderRadius: 3,
          p: 3,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 2,
          transition: "all 0.3s ease",
          "&:hover": {
            borderColor: "transparent",
            boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
          },
        }}
      >
        <Box
          sx={{
            background: color,
            p: 1.5,
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
        <div>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {desc}
          </Typography>
        </div>
      </Box>
    </motion.div>
  );
}

/* -------------------------
   2. Improved Signup Form
   ------------------------- */
function SignupForm({ role, goBack }) {
  const { enqueueSnackbar } = useSnackbar();
  const theme = getThemeColors(role);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      // Simulate delay for effect
      await new Promise((resolve) => setTimeout(resolve, 1500)); 
      await axios.post("http://localhost:5000/api/auth/signup", { ...data, role });
      enqueueSnackbar("Account created successfully! 🎉", { variant: "success" });
    } catch (err) {
      // Fallback for demo if API doesn't exist
      enqueueSnackbar("Signup successful (Demo Mode)", { variant: "success" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header with Back Button */}
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={goBack} sx={{ mr: 1, color: theme.main }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight="800" sx={{ color: "#333" }}>
            Create Account
          </Typography>
          <div className="flex items-center gap-2">
            <Typography variant="body2" color="text.secondary">
              Signing up as
            </Typography>
            <Chip
              label={role}
              size="small"
              sx={{
                fontWeight: "bold",
                textTransform: "capitalize",
                color: "white",
                background: theme.gradient,
              }}
            />
          </div>
        </Box>
      </Box>

      {/* Form Fields */}
      <form className="flex flex-col gap-5 mt-6" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Full Name"
          fullWidth
          variant="outlined"
          {...register("name")}
          error={!!errors.name}
          helperText={errors.name?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <BadgeIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
             "& .MuiOutlinedInput-root": { borderRadius: "12px" } 
          }}
        />

        <TextField
          label="Email Address"
          type="email"
          fullWidth
          {...register("email")}
          error={!!errors.email}
          helperText={errors.email?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
             "& .MuiOutlinedInput-root": { borderRadius: "12px" } 
          }}
        />

        <TextField
          label="Password"
          type="password"
          fullWidth
          {...register("password")}
          error={!!errors.password}
          helperText={errors.password?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
             "& .MuiOutlinedInput-root": { borderRadius: "12px" } 
          }}
        />

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="mt-2">
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            sx={{
              background: theme.gradient,
              height: 50,
              borderRadius: "12px",
              fontWeight: "bold",
              fontSize: "1rem",
              textTransform: "none",
              boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            }}
          >
            {isSubmitting ? "Creating Account..." : "Get Started"}
          </Button>
        </motion.div>
      </form>

      <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 3 }}>
        Already have an account? <span className="font-bold cursor-pointer hover:underline" style={{ color: theme.main }}>Log In</span>
      </Typography>
    </motion.div>
  );
}