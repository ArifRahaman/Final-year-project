import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Card,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Email as EmailIcon,
} from "@mui/icons-material";

// ✅ IMPORT THE EXTERNAL CSS FILE HERE
import "./TeacherRequests.css"; 

const TeacherRequests = () => {
  const { courseId } = useParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const incomingRequests = data.enrollRequests || data.course?.enrollRequests || [];
      setRequests(incomingRequests);
    } catch (error) {
      console.error(error);
      toast.error("Could not load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, studentId) => {
    setProcessingId(studentId);
    try {
      const token = localStorage.getItem("token");
      const endpoint = action === "approve" ? "approve" : "reject";

      await axios.patch(
        `http://localhost:5000/api/courses/${courseId}/${endpoint}/${studentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(action === "approve" ? "Student Enrolled!" : "Request Rejected");
      setRequests((prev) => prev.filter((r) => (r.student._id || r.student) !== studentId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  const stringToColor = (string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i++) hash = string.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  return (
    // ✅ APPLY THE CLASS NAME HERE
    <div className="bw-grid-bg p-8">
      
      <div className="max-w-6xl mx-auto mt-10">
        {/* Header Section */}
        <Box className="flex justify-between items-center mb-8">
          <div>
            {/* White text to contrast with black background */}
            <Typography variant="h4" fontWeight="800" sx={{ color: "white" }}>
              Enrollment Requests
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255, 0.7)", mt: 1 }}>
              Manage students requesting access to your course.
            </Typography>
          </div>
          {!loading && (
            <Chip
              label={`${requests.length} Pending`}
              color={requests.length > 0 ? "error" : "default"}
              variant={requests.length > 0 ? "filled" : "outlined"}
              sx={{ 
                fontWeight: "bold", 
                borderRadius: 2, 
                borderColor: "rgba(255,255,255,0.3)",
                color: requests.length === 0 ? "white" : undefined
              }}
            />
          )}
        </Box>

        {/* Card kept white for contrast */}
        <Card elevation={10} sx={{ borderRadius: 4, overflow: "hidden", bgcolor: "white" }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", color: "#64748b" }}>STUDENT</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#64748b" }}>CONTACT</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#64748b" }}>REQUESTED</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold", color: "#64748b" }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton variant="circular" width={40} height={40} /></TableCell>
                      <TableCell><Skeleton variant="text" width={150} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={120} height={36} /></TableCell>
                    </TableRow>
                  ))
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <Box className="flex flex-col items-center opacity-60">
                        <PersonIcon sx={{ fontSize: 60, color: "#cbd5e1", mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">All caught up!</Typography>
                        <Typography variant="body2" color="text.secondary">
                          No pending enrollment requests found.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {requests.map((req) => {
                      const student = req.student || {};
                      const sId = student._id || student;
                      const name = student.name || "Unknown";
                      const email = student.email || "No Email";
                      const isProcessing = processingId === sId;

                      return (
                        <Box
                          component={motion.tr}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20, backgroundColor: "#fee2e2" }}
                          key={sId}
                          sx={{ "&:hover": { backgroundColor: "#f8fafc" } }}
                          className="border-b last:border-0 border-gray-100 transition-colors"
                        >
                          <TableCell>
                            <Box className="flex items-center gap-3">
                              <Avatar
                                sx={{
                                  bgcolor: stringToColor(name),
                                  fontWeight: "bold",
                                  width: 40,
                                  height: 40,
                                  boxShadow: 1
                                }}
                              >
                                {name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight="700">
                                  {name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" className="font-mono">
                                  ID: {String(sId).slice(-6)}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Box className="flex items-center gap-2 text-gray-600">
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">{email}</Typography>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Chip
                              icon={<TimeIcon fontSize="small" />}
                              label={req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : "Today"}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: "#e2e8f0", color: "#64748b" }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Box className="flex justify-end gap-2">
                              <Tooltip title="Reject Request">
                                <IconButton
                                  onClick={() => handleAction("reject", sId)}
                                  disabled={isProcessing}
                                  color="error"
                                  sx={{ border: "1px solid #fee2e2", "&:hover": { bgcolor: "#fee2e2" } }}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Button
                                variant="contained"
                                onClick={() => handleAction("approve", sId)}
                                disabled={isProcessing}
                                startIcon={!isProcessing && <CheckIcon />}
                                sx={{
                                  textTransform: "none",
                                  borderRadius: 2,
                                  px: 3,
                                  bgcolor: "primary.main",
                                  "&:hover": { bgcolor: "primary.dark" }
                                }}
                              >
                                {isProcessing ? "Processing..." : "Approve"}
                              </Button>
                            </Box>
                          </TableCell>
                        </Box>
                      );
                    })}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </div>
    </div>
  );
};

export default TeacherRequests;
