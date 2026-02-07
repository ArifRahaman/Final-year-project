import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  CircularProgress,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  CardActionArea,
  IconButton,
  Tooltip,
  Divider,
  Fade,
  Paper
} from "@mui/material";
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  School as SchoolIcon, 
  MoreVert as MoreVertIcon,
  Search as SearchIcon
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import axios from "axios";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // --- State Management ---
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]); // Search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Modal State
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });

  const token = localStorage.getItem("token");

  // --- Effects ---
  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const results = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCourses(results);
  }, [searchTerm, courses]);

  // --- API Functions ---
  async function fetchCourses() {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/courses/teacher", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data);
      setFilteredCourses(res.data);
    } catch (err) {
      console.error(err);
      enqueueSnackbar("Failed to load courses", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCourse() {
    if (!formData.title || !formData.description) {
      enqueueSnackbar("Title and Description are required", { variant: "warning" });
      return;
    }

    try {
      setCreating(true);
      const res = await axios.post(
        "http://localhost:5000/api/courses",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      enqueueSnackbar("Course created successfully!", { variant: "success" });
      const newCourse = res.data.course || res.data; 
      setCourses((prev) => [...prev, newCourse]);
      handleClose();
    } catch (err) {
      console.error(err);
      enqueueSnackbar(err?.response?.data?.message || "Creation failed", {
        variant: "error",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteCourse(courseId, e) {
    e.stopPropagation(); // Prevent card click
    if(!window.confirm("Are you sure you want to delete this course? This cannot be undone.")) return;

    try {
        await axios.delete(`http://localhost:5000/api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setCourses((prev) => prev.filter((c) => c._id !== courseId));
        enqueueSnackbar("Course deleted", { variant: "success" });
    } catch (err) {
        enqueueSnackbar("Failed to delete course", { variant: "error" });
    }
  }

  // --- Event Handlers ---
  const handleOpen = () => setOpen(true);
  
  const handleClose = () => {
    setOpen(false);
    setFormData({ title: "", description: "" });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEnterCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  // --- Render ---
  return (
    <Box className="min-h-screen p-6 bg-gray-100">
      <Box className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <Paper elevation={0} className="p-6 mb-8 rounded-2xl bg-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <Typography variant="h4" fontWeight={800} className="text-gray-800">
              Teacher Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" className="mt-1">
              Welcome back! Manage your curriculum and student progress.
            </Typography>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-grow md:flex-grow-0">
                <SearchIcon className="absolute left-3 top-2.5 text-gray-400" fontSize="small" />
                <input 
                  type="text" 
                  placeholder="Search courses..." 
                  className="pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={handleOpen}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, paddingX: 3 }}
             >
                New Course
             </Button>
          </div>
        </Paper>

        {/* Loading / Content State */}
        {loading ? (
          <Box className="flex flex-col items-center justify-center py-20">
            <CircularProgress size={60} thickness={4} />
            <Typography className="mt-4 text-gray-500 font-medium">Loading your classroom...</Typography>
          </Box>
        ) : filteredCourses.length === 0 ? (
          <Box className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
            <div className="bg-blue-50 p-6 rounded-full mb-4">
                <SchoolIcon style={{ fontSize: 60, color: '#3b82f6' }} />
            </div>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              {searchTerm ? "No courses found" : "No courses created yet"}
            </Typography>
            <Typography color="text.secondary" className="mb-6 max-w-md">
              {searchTerm 
                ? "Try adjusting your search terms." 
                : "Get started by creating your first course to share materials and assignments with students."}
            </Typography>
            {!searchTerm && (
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpen}>
                Create Now
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredCourses.map((course) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={course._id}>
                <Fade in={true} timeout={500}>
                  <Card 
                    elevation={0}
                    className="h-full flex flex-col border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white"
                  >
                    <CardActionArea 
                      onClick={() => handleEnterCourse(course._id)}
                      className="flex-1 flex flex-col items-stretch h-full"
                    >
                      {/* Course "Cover" Gradient */}
                      <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                        <Avatar 
                            sx={{ 
                                width: 56, 
                                height: 56, 
                                bgcolor: 'white', 
                                color: '#3b82f6', 
                                fontWeight: 'bold',
                                fontSize: '1.5rem',
                                position: 'absolute',
                                bottom: -28,
                                left: 24,
                                border: '4px solid white'
                            }}
                        >
                          {course.title ? course.title[0].toUpperCase() : "C"}
                        </Avatar>
                      </div>

                      <CardContent className="pt-10 pb-4 px-6 flex-1">
                        <div className="flex justify-between items-start">
                            <Typography variant="h6" fontWeight={700} className="line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {course.title}
                            </Typography>
                        </div>
                        
                        <Typography variant="body2" color="text.secondary" className="mt-2 line-clamp-2 min-h-[40px]">
                          {course.description || "No description provided."}
                        </Typography>

                        <div className="mt-4 flex gap-2">
                           <Chip label="Active" size="small" color="success" variant="outlined" className="bg-green-50" />
                           <Chip label={`${course.studentsCount || 0} Students`} size="small" variant="outlined" />
                        </div>
                      </CardContent>
                    </CardActionArea>

                    <Divider />

                    <CardActions className="justify-between p-3 bg-gray-50">
                      <Button 
                          size="small" 
                          variant="text" 
                          color="primary"
                          onClick={() => handleEnterCourse(course._id)}
                          sx={{ fontWeight: 600 }}
                      >
                          Enter Class
                      </Button>
                      <Tooltip title="Delete Course">
                        <IconButton 
                            size="small" 
                            color="error"
                            onClick={(e) => handleDeleteCourse(course._id, e)}
                            className="hover:bg-red-50"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>
            ))}
            
          </Grid>
        )}

        {/* --- Create Course Dialog --- */}
        <Dialog 
            open={open} 
            onClose={handleClose} 
            fullWidth 
            maxWidth="sm"
            PaperProps={{
                style: { borderRadius: 16, padding: 8 }
            }}
        >
          <DialogTitle>
            <Typography variant="h5" fontWeight={700}>Create New Course</Typography>
            <Typography variant="body2" color="text.secondary">Set up a new space for your students.</Typography>
          </DialogTitle>
          <DialogContent className="mt-2">
            <Box component="form" className="flex flex-col gap-5 pt-2">
              <TextField
                label="Course Title"
                name="title"
                fullWidth
                variant="outlined"
                placeholder="e.g., Advanced Physics 101"
                value={formData.title}
                onChange={handleChange}
                autoFocus
                InputProps={{
                    style: { borderRadius: 12 }
                }}
              />
              <TextField
                label="Description"
                name="description"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                placeholder="Briefly describe what this course covers..."
                value={formData.description}
                onChange={handleChange}
                InputProps={{
                    style: { borderRadius: 12 }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions className="p-4">
            <Button onClick={handleClose} color="inherit" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCourse} 
              variant="contained" 
              disabled={creating}
              disableElevation
              sx={{ borderRadius: 2, px: 4, py: 1 }}
            >
              {creating ? <CircularProgress size={24} color="inherit" /> : "Create Course"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
