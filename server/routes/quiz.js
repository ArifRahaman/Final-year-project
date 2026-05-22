const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createQuiz, getQuiz, submitQuiz, getResults, deleteQuiz } = require('../controllers/quizController');

const router = express.Router({ mergeParams: true }); // mergeParams to get :id from parent

router.get('/', protect, getQuiz);
router.post('/', protect, authorize('teacher'), createQuiz);
router.post('/attempt', protect, authorize('student'), submitQuiz);
router.get('/results', protect, authorize('teacher'), getResults);
router.delete('/', protect, authorize('teacher'), deleteQuiz);

module.exports = router;
