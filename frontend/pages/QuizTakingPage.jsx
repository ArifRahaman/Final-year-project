import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Box, Typography, Button, Paper, Radio, RadioGroup, 
    FormControlLabel, FormControl, CircularProgress, 
    LinearProgress, Card, CardContent, Divider 
} from '@mui/material';
import { useSnackbar } from 'notistack';

export default function QuizTakingPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const token = localStorage.getItem("token");

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: selectedIndex }
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(null);

    // Fetch Quiz Data
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/quizzes/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setQuiz(res.data);
            } catch (err) {
                enqueueSnackbar("Failed to load quiz", { variant: "error" });
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId, token, navigate, enqueueSnackbar]);

    const handleOptionSelect = (qId, optionIndex) => {
        setAnswers(prev => ({
            ...prev,
            [qId]: optionIndex
        }));
    };

    const handleSubmit = async () => {
        // Simple client-side scoring for immediate feedback 
        // (Ideally, send answers to backend to calculate score securetly)
        let calculatedScore = 0;
        quiz.questions.forEach(q => {
            if (answers[q._id] === q.correctIndex) {
                calculatedScore++;
            }
        });

        const finalScore = (calculatedScore / quiz.questions.length) * 100;
        setScore(finalScore);
        setIsSubmitted(true);

        // Upload Result to Backend
        try {
            await axios.post(`http://localhost:5000/api/quizzes/${quizId}/submit`, {
                answers: answers,
                score: finalScore
            }, { headers: { Authorization: `Bearer ${token}` } });
            enqueueSnackbar("Quiz submitted successfully!", { variant: "success" });
        } catch (err) {
            console.error("Submission error", err);
            // Even if backend save fails, show user their local score
        }
    };

    if (loading) return <Box className="h-screen flex justify-center items-center"><CircularProgress /></Box>;
    if (!quiz) return <Typography>Quiz not found</Typography>;

    // --- RESULT VIEW ---
    if (isSubmitted) {
        return (
            <Box className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
                <Paper className="p-8 max-w-md w-full text-center shadow-lg">
                    <Typography variant="h4" className="mb-4 font-bold text-blue-900">Quiz Results</Typography>
                    <Divider className="my-4" />
                    
                    <Box className="my-6">
                        <CircularProgress 
                            variant="determinate" 
                            value={score} 
                            size={120} 
                            thickness={4} 
                            color={score >= 60 ? "success" : "warning"}
                        />
                        <Box className="mt-4">
                            <Typography variant="h3" fontWeight="bold">{score.toFixed(0)}%</Typography>
                            <Typography color="text.secondary">
                                You got {Math.round((score / 100) * quiz.questions.length)} out of {quiz.questions.length} correct.
                            </Typography>
                        </Box>
                    </Box>

                    <Button variant="contained" fullWidth onClick={() => navigate(-1)}>
                        Back to Course
                    </Button>
                </Paper>
            </Box>
        );
    }

    // --- TAKING QUIZ VIEW ---
    const currentQ = quiz.questions[currentQIndex];
    const progress = ((currentQIndex + 1) / quiz.questions.length) * 100;

    return (
        <Box className="min-h-screen bg-gray-50 p-6 flex justify-center">
            <Box className="max-w-3xl w-full">
                {/* Header */}
                <Box className="mb-6 flex justify-between items-end">
                    <Box>
                        <Typography variant="h5" fontWeight={700}>{quiz.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Question {currentQIndex + 1} of {quiz.questions.length}
                        </Typography>
                    </Box>
                    {quiz.timeLimitMinutes && (
                        <Typography variant="subtitle2" color="error" className="font-mono bg-red-50 p-2 rounded">
                            Time Limit: {quiz.timeLimitMinutes} min
                        </Typography>
                    )}
                </Box>

                <LinearProgress variant="determinate" value={progress} className="mb-6 rounded h-2" />

                {/* Question Card */}
                <Card className="shadow-md mb-6">
                    <CardContent className="p-6">
                        <Typography variant="h6" className="mb-6 font-medium">
                            {currentQ.questionText}
                        </Typography>

                        <FormControl component="fieldset" className="w-full">
                            <RadioGroup
                                value={answers[currentQ._id] !== undefined ? answers[currentQ._id] : ""}
                                onChange={(e) => handleOptionSelect(currentQ._id, parseInt(e.target.value))}
                            >
                                {currentQ.options.map((opt, idx) => (
                                    <Paper 
                                        key={idx} 
                                        className={`mb-3 p-2 border transition-all ${
                                            answers[currentQ._id] === idx 
                                            ? "border-blue-500 bg-blue-50" 
                                            : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                        variant="outlined"
                                    >
                                        <FormControlLabel
                                            value={idx}
                                            control={<Radio />}
                                            label={opt}
                                            className="w-full m-0"
                                        />
                                    </Paper>
                                ))}
                            </RadioGroup>
                        </FormControl>
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <Box className="flex justify-between">
                    <Button 
                        disabled={currentQIndex === 0}
                        onClick={() => setCurrentQIndex(prev => prev - 1)}
                    >
                        Previous
                    </Button>

                    {currentQIndex < quiz.questions.length - 1 ? (
                        <Button 
                            variant="contained" 
                            onClick={() => setCurrentQIndex(prev => prev + 1)}
                        >
                            Next Question
                        </Button>
                    ) : (
                        <Button 
                            variant="contained" 
                            color="success" 
                            size="large"
                            onClick={handleSubmit}
                        >
                            Submit Quiz
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
