const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const {
  createCard, getCards, getCardById, getMyCards, updateCard, deleteCard
} = require('../controllers/cardController');
const {
  createQuiz, getQuiz, submitQuiz, getResults, deleteQuiz
} = require('../controllers/quizController');
const {
  getMessages, postMessage, deleteMessage
} = require('../controllers/chatController');

const router = express.Router();

// ===== CARDS =====
router.get('/', getCards);
router.post('/', protect, authorize('teacher'), upload.array('files', 10), createCard);
router.get('/my/cards', protect, authorize('teacher'), getMyCards);
router.get('/:id', protect, getCardById);
router.put('/:id', protect, authorize('teacher'), upload.array('files', 10), updateCard);
router.delete('/:id', protect, authorize('teacher'), deleteCard);

// ===== QUIZ =====
router.get('/:id/quiz', protect, getQuiz);
router.post('/:id/quiz', protect, authorize('teacher'), createQuiz);
router.post('/:id/quiz/attempt', protect, authorize('student'), submitQuiz);
router.get('/:id/quiz/results', protect, authorize('teacher'), getResults);
router.delete('/:id/quiz', protect, authorize('teacher'), deleteQuiz);

// ===== DISCUSSION =====
router.get('/:id/chat', protect, getMessages);
router.post('/:id/chat', protect, postMessage);
router.delete('/:id/chat/:msgId', protect, deleteMessage);

module.exports = router;
