import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Paper,
  Tabs,
  Tab,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  PictureAsPdf as PdfIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Assignment as AssignmentIcon,
  Quiz as QuizIcon,
  Add as AddIcon,
  VideoLibrary as VideoLibraryIcon,
  PlayArrow as PlayArrowIcon,
  Assessment as AssessmentIcon
} from "@mui/icons-material";
import axios from "axios";
import { useSnackbar } from "notistack";
import { jwtDecode } from "jwt-decode";

// =========================================================
// 1. HELPER COMPONENT
// =========================================================
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// =========================================================
// 2. MAIN COMPONENT
// =========================================================
export default function CourseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const token = localStorage.getItem("token");

  // --- Determine User Role ---
  let userRole = "student";
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role || "student";
    } catch (e) { console.error("Token decode error", e); }
  }
  const isTeacher = userRole === "teacher" || userRole === "admin";

  // --- Global State ---
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // --- PDF & Video State ---
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  // ... existing states ...

  // --- Submission State ---
  const [submissionFile, setSubmissionFile] = useState(null); // File selected by student
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false); // For teacher to view list
  const [currentAssignmentSubmissions, setCurrentAssignmentSubmissions] = useState([]); // List of submissions
  const [viewingAssignmentTitle, setViewingAssignmentTitle] = useState("");
  // --- Assignment State ---
  const [assignments, setAssignments] = useState([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  // --- Quiz State ---
  const [quizzes, setQuizzes] = useState([]);

  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizTimeLimit, setQuizTimeLimit] = useState(10);
  const [questionsBuffer, setQuestionsBuffer] = useState([]);

  // Single Question Input State
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOptionLetter, setCorrectOptionLetter] = useState("");
  const [mySubmissions, setMySubmissions] = useState({});
  // --- Results Modal State ---
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedQuizResults, setSelectedQuizResults] = useState(null);

  // --- 1. Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourse(courseRes.data);

        // Fetch Quizzes
        try {
          const quizRes = await axios.get(`http://localhost:5000/api/quizzes?courseId=${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setQuizzes(quizRes.data);
        } catch (err) { console.log("No quizzes found"); }

        // Fetch Assignments & My Submissions
        try {
          const assignRes = await axios.get(`http://localhost:5000/api/assignments?courseId=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAssignments(assignRes.data);

          // ⭐ ADD THIS BLOCK: Fetch Student's Submission Status
          if (!isTeacher) {
            const mySubRes = await axios.get(`http://localhost:5000/api/my-submissions?courseId=${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            // Convert array to a map for easy lookup: { assignmentId: submissionData }
            const subMap = {};
            mySubRes.data.forEach(sub => {
              subMap[sub.assignmentId] = sub;
            });
            setMySubmissions(subMap);
          }

        } catch (assignErr) { console.log("Assignments empty"); }



      } catch (err) {
        enqueueSnackbar("Failed to load course details", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token, enqueueSnackbar]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // --- 2. PDF Handlers ---
  const handlePdfChange = (e) => setSelectedPdf(e.target.files[0]);

  const handleUploadPdf = async () => {
    if (!selectedPdf) return;
    const formData = new FormData();
    formData.append("pdf", selectedPdf);
    try {
      setUploadingPdf(true);
      const res = await axios.post(
        `http://localhost:5000/api/courses/${id}/upload`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      setCourse(res.data.course);
      setSelectedPdf(null);
      enqueueSnackbar("PDF Uploaded", { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Upload failed", { variant: "error" });
    } finally {
      setUploadingPdf(false);
    }
  };
  // STUDENT: Handle File Selection
  const handleSubmissionFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSubmissionFile(e.target.files[0]);
    }
  };

  // STUDENT: Upload Submission
  // STUDENT: Upload Submission
  const handleSubmitAssignment = async (assignmentId) => {
    if (!submissionFile) return enqueueSnackbar("Please select a file first", { variant: "warning" });

    const formData = new FormData();
    formData.append("file", submissionFile);

    try {
      const res = await axios.post(`http://localhost:5000/api/assignments/${assignmentId}/submit`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      enqueueSnackbar("Assignment Submitted Successfully!", { variant: "success" });
      setSubmissionFile(null);

      // ⭐ ADD THIS: Update local state immediately so button changes to "Submitted"
      setMySubmissions(prev => ({
        ...prev,
        [assignmentId]: res.data.submission
      }));

    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Submission failed", { variant: "error" });
    }
  };


  // TEACHER: View Submissions
  const handleViewSubmissions = async (assignmentId, title) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentAssignmentSubmissions(res.data);
      setViewingAssignmentTitle(title);
      setSubmissionDialogOpen(true);
    } catch (err) {
      enqueueSnackbar("Failed to load submissions", { variant: "error" });
    }
  };


  const handleDeletePdf = async (fileId) => {
    if (!window.confirm("Delete this PDF?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/courses/${id}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourse(prev => ({ ...prev, pdfFiles: prev.pdfFiles.filter(f => f._id !== fileId) }));
      enqueueSnackbar("PDF deleted", { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Delete failed", { variant: "error" });
    }
  };

  // --- 3. VIDEO Handlers ---
  const handleVideoChange = (e) => setSelectedVideo(e.target.files[0]);

  const handleUploadVideo = async () => {
    if (!selectedVideo) return;
    const formData = new FormData();
    formData.append("video", selectedVideo);
    try {
      setUploadingVideo(true);
      const res = await axios.post(
        `http://localhost:5000/api/courses/${id}/upload-video`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      setCourse(res.data.course);
      setSelectedVideo(null);
      enqueueSnackbar("Video Uploaded", { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Video upload failed", { variant: "error" });
    } finally {
      setUploadingVideo(false);
    }
  };







  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Delete this video?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/courses/${id}/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourse(prev => ({ ...prev, videoFiles: prev.videoFiles.filter(v => v._id !== videoId) }));
      enqueueSnackbar("Video deleted", { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Delete failed", { variant: "error" });
    }
  };

  // --- 4. Assignment Handlers ---
  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.dueDate) {
      enqueueSnackbar("Title and Due Date are required", { variant: "warning" });
      return;
    }
    try {
      const res = await axios.post(
        `http://localhost:5000/api/assignments`,
        { ...newAssignment, courseId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments([...assignments, res.data]);
      setShowAssignForm(false);
      setNewAssignment({ title: "", description: "", dueDate: "" });
      enqueueSnackbar("Assignment Created", { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Failed to create assignment", { variant: "error" });
    }
  };

  // --- 5. Quiz Handlers ---
  const handleAddQuestionToBuffer = () => {
    if (!currentQuestion || !optionA || !optionB || !correctOptionLetter) {
      enqueueSnackbar("Please fill Question, at least 2 Options, and select Correct Answer", { variant: "warning" });
      return;
    }
    const rawOptions = [optionA, optionB, optionC, optionD].filter(opt => opt !== "");
    const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    const correctIndex = letterMap[correctOptionLetter];

    if (correctIndex >= rawOptions.length) {
      enqueueSnackbar("Selected correct option is empty", { variant: "error" });
      return;
    }
    setQuestionsBuffer([...questionsBuffer, {
      questionText: currentQuestion,
      options: rawOptions,
      correctIndex: correctIndex,
    }]);
    setCurrentQuestion(""); setOptionA(""); setOptionB(""); setOptionC(""); setOptionD(""); setCorrectOptionLetter("");
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle || questionsBuffer.length === 0) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/quizzes`, {
        courseId: id,
        title: quizTitle,
        questions: questionsBuffer,
        timeLimitMinutes: quizTimeLimit,
        published: true,
        allowMultipleAttempts: false
      }, { headers: { Authorization: `Bearer ${token}` } });

      setQuizzes([...quizzes, res.data]);
      setShowQuizForm(false); setQuizTitle(""); setQuestionsBuffer([]);
      enqueueSnackbar("Quiz Created Successfully", { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Failed to create quiz", { variant: "error" });
    }
  };

  const handleViewResults = async (quizId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedQuizResults(res.data);
      setResultDialogOpen(true);
    } catch (err) {
      enqueueSnackbar("Failed to fetch results", { variant: "error" });
    }
  };

  if (loading) return <Box className="flex justify-center p-10"><CircularProgress /></Box>;
  if (!course) return <Typography className="p-10">Course not found</Typography>;

  return (
    <Box className="min-h-screen p-6 bg-gray-50">
      <Box className="max-w-6xl mx-auto">

        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} className="mb-4">
          Back
        </Button>

        <Card className="mb-4 shadow-sm border-t-4 border-t-blue-600">
          <CardContent>
            <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
              {course.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {course.description}
            </Typography>
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "white" }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<DescriptionIcon />} iconPosition="start" label="Overview" />
            <Tab icon={<FolderIcon />} iconPosition="start" label="PDFs" />
            <Tab icon={<VideoLibraryIcon />} iconPosition="start" label="Videos" />
            <Tab icon={<AssignmentIcon />} iconPosition="start" label="Assignments" />
            <Tab icon={<QuizIcon />} iconPosition="start" label="Quizzes" />
          </Tabs>
        </Box>

        {/* --- TAB 0: OVERVIEW --- */}
        <CustomTabPanel value={tabValue} index={0}>
          <Paper className="p-6 shadow-sm">
            <Typography variant="h6" gutterBottom>About this Course</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {course.description || "No description provided."}
            </Typography>
            <Box className="mt-4 flex gap-4">
              <Chip label={`${course.pdfFiles?.length || 0} PDFs`} color="primary" variant="outlined" />
              <Chip label={`${course.videoFiles?.length || 0} Videos`} color="secondary" variant="outlined" />
              <Chip label={`${assignments.length} Assignments`} color="success" variant="outlined" />
            </Box>
          </Paper>
        </CustomTabPanel>

        {/* --- TAB 1: PDF MATERIALS --- */}
        <CustomTabPanel value={tabValue} index={1}>
          {isTeacher && (
            <Paper className="p-6 mb-6 shadow-sm bg-blue-50 border border-blue-100">
              <Typography variant="subtitle1" fontWeight={600} className="mb-4">Upload PDF Document</Typography>
              <Box className="flex gap-4 items-center flex-wrap">
                <input
                  accept="application/pdf"
                  style={{ display: "none" }}
                  id="pdf-upload-input"
                  type="file"
                  onChange={handlePdfChange}
                />
                <label htmlFor="pdf-upload-input">
                  <Button variant="outlined" component="span">Select PDF</Button>
                </label>
                <Typography variant="body2" className="flex-grow text-gray-600 truncate">
                  {selectedPdf ? selectedPdf.name : "No file selected"}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleUploadPdf}
                  disabled={!selectedPdf || uploadingPdf}
                >
                  {uploadingPdf ? "Uploading..." : "Upload PDF"}
                </Button>
              </Box>
            </Paper>
          )}

          <Card className="shadow-sm">
            <List>
              {(course.pdfFiles || []).map((file, index) => (
                <React.Fragment key={file._id}>
                  <ListItem
                    secondaryAction={
                      isTeacher && (
                        <IconButton edge="end" onClick={() => handleDeletePdf(file._id)}>
                          <DeleteIcon color="action" />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemIcon><PdfIcon color="error" /></ListItemIcon>
                    <ListItemText
                      primary={
                  <a 
  href={file.filePath} 
  target="_blank" 
  rel="noopener noreferrer" 
  className="text-blue-700 hover:underline font-medium"
>
  {file.fileName}
</a>

                      }
                      secondary={`Uploaded: ${new Date(file.uploadedAt).toLocaleDateString()}`}
                    />
                  </ListItem>
                  {index < course.pdfFiles.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Card>
        </CustomTabPanel>

        {/* --- TAB 2: VIDEO MATERIALS --- */}
        <CustomTabPanel value={tabValue} index={2}>
          {isTeacher && (
            <Paper className="p-6 mb-6 shadow-sm bg-purple-50 border border-purple-100">
              <Typography variant="subtitle1" fontWeight={600} className="mb-4">Upload Video Lesson</Typography>
              <Box className="flex gap-4 items-center flex-wrap">
                <input
                  accept="video/*"
                  style={{ display: "none" }}
                  id="video-upload-input"
                  type="file"
                  onChange={handleVideoChange}
                />
                <label htmlFor="video-upload-input">
                  <Button variant="outlined" color="secondary" component="span">Select Video</Button>
                </label>
                <Typography variant="body2" className="flex-grow text-gray-600 truncate">
                  {selectedVideo ? selectedVideo.name : "No video selected"}
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleUploadVideo}
                  disabled={!selectedVideo || uploadingVideo}
                >
                  {uploadingVideo ? "Uploading..." : "Upload Video"}
                </Button>
              </Box>
            </Paper>
          )}

          <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(course.videoFiles || []).map((video) => (
              <Card key={video._id} className="shadow-md hover:shadow-lg transition-shadow">
                <Box sx={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000' }}>
                  <video
                    controls
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    src={`http://localhost:5000/${video.filePath}`}
                  />
                </Box>
                <CardContent>
                  <Box className="flex justify-between items-start">
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600} className="truncate">
                        {video.fileName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(video.uploadedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    {isTeacher && (
                      <IconButton size="small" onClick={() => handleDeleteVideo(video._id)}>
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CustomTabPanel>

        {/* --- TAB 3: ASSIGNMENTS --- */}
        {/* --- TAB 3: ASSIGNMENTS --- */}
        <CustomTabPanel value={tabValue} index={3}>
          {isTeacher && (
            <Box className="flex justify-end mb-4">
              <Button
                variant={showAssignForm ? "outlined" : "contained"}
                color={showAssignForm ? "error" : "primary"}
                startIcon={showAssignForm ? <DeleteIcon /> : <AddIcon />}
                onClick={() => setShowAssignForm(!showAssignForm)}
              >
                {showAssignForm ? "Cancel" : "Create Assignment"}
              </Button>
            </Box>
          )}

          {showAssignForm && isTeacher && (
            <Paper className="p-6 mb-6 border-l-4 border-l-green-500 shadow-md bg-white">
              <Typography variant="h6" className="mb-4">New Assignment</Typography>
              <Box className="flex flex-col gap-4">
                <TextField label="Title" fullWidth size="small" value={newAssignment.title} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} />
                <TextField label="Description" fullWidth multiline rows={3} value={newAssignment.description} onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })} />
                <TextField label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={newAssignment.dueDate} onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })} />
                <Button variant="contained" color="success" onClick={handleCreateAssignment}>Post Assignment</Button>
              </Box>
            </Paper>
          )}


          <div className="space-y-4">
            {assignments.map((assign) => {
              // ⭐ CHECK IF SUBMITTED
              const mySubmission = mySubmissions[assign._id];

              return (
                <Card key={assign._id} className="shadow-sm border border-gray-100">
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Typography variant="h6">{assign.title}</Typography>

                          {/* ⭐ SHOW TAG IF SUBMITTED */}
                          {!isTeacher && mySubmission && (
                            <Chip label="Submitted" color="success" size="small" variant="outlined" />
                          )}
                        </div>

                        <Typography variant="caption" className="text-red-500 font-bold">
                          Due: {new Date(assign.dueDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" className="mt-2 text-gray-700">{assign.description}</Typography>
                      </div>
                      {isTeacher && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FolderIcon />}
                          onClick={() => handleViewSubmissions(assign._id, assign.title)}
                        >
                          View Submissions
                        </Button>
                      )}
                    </div>

                    {/* STUDENT ACTION AREA */}
                    {!isTeacher && (
                      <Box className="mt-4 p-3 bg-gray-50 rounded border border-dashed border-gray-300">
                        {mySubmission ? (
                          // ⭐ CASE 1: ALREADY SUBMITTED -> SHOW STATUS
                          <div className="flex items-center justify-between">
                            <Box>
                              <Typography variant="subtitle2" className="text-green-700 font-bold">
                                Assignment Handed In
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Submitted on: {new Date(mySubmission.submittedAt).toLocaleString()}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              href={mySubmission.fileUrl}
                              target="_blank"
                            >
                              View My File
                            </Button>
                          </div>
                        ) : (
                          // ⭐ CASE 2: NOT SUBMITTED -> SHOW UPLOAD FORM
                          <>
                            <Typography variant="caption" className="block mb-2 font-bold text-gray-500">
                              Upload your work (PDF/Word):
                            </Typography>
                            <div className="flex gap-2 items-center">
                              <input
                                type="file"
                                className="text-sm"
                                onChange={handleSubmissionFileChange}
                              />
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => handleSubmitAssignment(assign._id)}
                                disabled={!submissionFile}
                              >
                                Submit
                              </Button>
                            </div>
                          </>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* TEACHER: SUBMISSIONS DIALOG */}
          <Dialog
            open={submissionDialogOpen}
            onClose={() => setSubmissionDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Submissions: {viewingAssignmentTitle}</DialogTitle>
            <DialogContent dividers>
              {currentAssignmentSubmissions.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow className="bg-gray-100">
                        <TableCell><strong>Student Name</strong></TableCell>
                        <TableCell><strong>Submitted At</strong></TableCell>
                        <TableCell align="right"><strong>Action</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentAssignmentSubmissions.map((sub) => (
                        <TableRow key={sub._id}>
                          <TableCell>{sub.studentId?.name || sub.studentId?.username || "Unknown"}</TableCell>
                          <TableCell>{new Date(sub.submittedAt).toLocaleString()}</TableCell>
                          <TableCell align="right">
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              href={sub.fileUrl}
                              target="_blank"
                            >
                              Download File
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography align="center" color="text.secondary" className="py-8">
                  No submissions yet.
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSubmissionDialogOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        </CustomTabPanel>


        {/* --- TAB 4: QUIZZES --- */}
        <CustomTabPanel value={tabValue} index={4}>
          {isTeacher && (
            <Box className="flex justify-end mb-4">
              <Button
                variant={showQuizForm ? "outlined" : "contained"}
                color={showQuizForm ? "error" : "primary"}
                startIcon={!showQuizForm && <AddIcon />}
                onClick={() => setShowQuizForm(!showQuizForm)}
              >
                {showQuizForm ? "Cancel Creation" : "Create New Quiz"}
              </Button>
            </Box>
          )}

          {showQuizForm && isTeacher && (
            <Paper className="p-6 mb-6 border-l-4 border-l-purple-500 bg-white">
              <Typography variant="h6" className="mb-4">Design Quiz</Typography>
              <TextField label="Quiz Title" fullWidth value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="mb-4" />
              <TextField label="Time Limit (Minutes)" type="number" fullWidth value={quizTimeLimit} onChange={(e) => setQuizTimeLimit(e.target.value)} className="mb-4" />

              <Box className="p-4 bg-gray-50 rounded border mb-4">
                <Typography variant="subtitle2" className="mb-2 font-bold text-gray-700">New Question</Typography>
                <TextField label="Question Text" fullWidth multiline rows={2} className="mb-3 bg-white" value={currentQuestion} onChange={(e) => setCurrentQuestion(e.target.value)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <TextField label="Option A" size="small" className="bg-white" value={optionA} onChange={(e) => setOptionA(e.target.value)} />
                  <TextField label="Option B" size="small" className="bg-white" value={optionB} onChange={(e) => setOptionB(e.target.value)} />
                  <TextField label="Option C" size="small" className="bg-white" value={optionC} onChange={(e) => setOptionC(e.target.value)} />
                  <TextField label="Option D" size="small" className="bg-white" value={optionD} onChange={(e) => setOptionD(e.target.value)} />
                </div>
                <div className="flex gap-2 mb-3">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <Button key={opt} size="small" variant={correctOptionLetter === opt ? "contained" : "outlined"} onClick={() => setCorrectOptionLetter(opt)} color="success">{opt}</Button>
                  ))}
                </div>
                <Button variant="outlined" fullWidth startIcon={<AddIcon />} onClick={handleAddQuestionToBuffer}>Add Question to Quiz</Button>
              </Box>

              <Button variant="contained" color="secondary" fullWidth onClick={handleSaveQuiz} disabled={questionsBuffer.length === 0}>Publish Quiz</Button>
            </Paper>
          )}

          <div className="grid gap-4">
            {quizzes.map((quiz) => (
              <Card key={quiz._id} className="shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                <CardContent className="flex justify-between items-center flex-wrap gap-4">
                  <Box>
                    <Typography variant="h6" className="text-blue-900">{quiz.title}</Typography>
                    <Box className="flex gap-2 mt-1">
                      <Chip label={`${quiz.questions.length} Questions`} size="small" />
                      <Chip label={`${quiz.timeLimitMinutes || 0} Mins`} size="small" icon={<PlayArrowIcon sx={{ height: 16 }} />} />
                    </Box>
                  </Box>
                  <Box>
                    {isTeacher ? (
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<AssessmentIcon />}
                        onClick={() => handleViewResults(quiz._id)}
                      >
                        View Results
                      </Button>
                    ) : (
                      <Button variant="contained" color="primary" startIcon={<PlayArrowIcon />} onClick={() => navigate(`/quiz/${quiz._id}`)}>
                        Start Quiz
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </div>
        </CustomTabPanel>

        {/* --- RESULTS DIALOG (TEACHER ONLY) --- */}
        <Dialog
          open={resultDialogOpen}
          onClose={() => setResultDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Quiz Results: {selectedQuizResults?.title}</DialogTitle>
          <DialogContent dividers>
            {selectedQuizResults?.attempts && selectedQuizResults.attempts.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow className="bg-gray-100">
                      <TableCell><strong>Student Name</strong></TableCell>
                      <TableCell align="center"><strong>Score (%)</strong></TableCell>
                      <TableCell align="right"><strong>Date Taken</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedQuizResults.attempts.map((attempt, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          {/* Handles populated object vs raw ID */}
                          {attempt.student?.fullName || attempt.student?.username || "Unknown Student"}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${attempt.score.toFixed(1)}%`}
                            color={attempt.score >= 50 ? "success" : "error"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {new Date(attempt.submittedAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography align="center" color="text.secondary" className="py-8">
                No students have taken this quiz yet.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResultDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
  );
}