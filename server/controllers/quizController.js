const Quiz = require('../models/Quiz');
const Card = require('../models/Card');

// @desc   Create or replace quiz for a card
// @route  POST /api/cards/:id/quiz
const createQuiz = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    if (card.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });

    const { title, description, questions } = req.body;
    if (!title || !questions || questions.length === 0)
      return res.status(400).json({ message: 'Title and at least one question are required' });

    // Remove old quiz if exists
    await Quiz.findOneAndDelete({ card: card._id });

    const quiz = await Quiz.create({ card: card._id, title, description, questions });
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Error creating quiz' });
  }
};

// @desc   Get quiz for a card (strips correct answers for students)
// @route  GET /api/cards/:id/quiz
const getQuiz = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const isOwner = card.creator.toString() === req.user._id.toString();
    const hasAccess = isOwner || card.accessList.some(u => u.toString() === req.user._id.toString());
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    const quiz = await Quiz.findOne({ card: card._id });
    if (!quiz) return res.status(404).json({ message: 'No quiz found for this card' });

    if (isOwner) {
      return res.json(quiz);
    }

    // For students: strip correctIndex
    const safeQuiz = quiz.toObject();
    safeQuiz.questions = safeQuiz.questions.map(({ correctIndex, ...q }) => q);

    // Include this student's best attempt
    const myAttempts = quiz.attempts.filter(a => a.student.toString() === req.user._id.toString());
    safeQuiz.myAttempts = myAttempts;

    res.json(safeQuiz);
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Error fetching quiz' });
  }
};

// @desc   Submit quiz attempt
// @route  POST /api/cards/:id/quiz/attempt
const submitQuiz = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const hasAccess = card.accessList.some(u => u.toString() === req.user._id.toString());
    if (!hasAccess && card.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied' });

    const quiz = await Quiz.findOne({ card: card._id });
    if (!quiz) return res.status(404).json({ message: 'No quiz found' });

    const { answers } = req.body; // array of number indices
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length)
      return res.status(400).json({ message: 'Provide an answer for every question' });

    // Score it
    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) score++;
    });

    quiz.attempts.push({
      student: req.user._id,
      answers,
      score,
      total: quiz.questions.length
    });
    await quiz.save();

    res.json({ score, total: quiz.questions.length, percentage: Math.round((score / quiz.questions.length) * 100) });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Error submitting quiz' });
  }
};

// @desc   Get all student attempts (teacher only)
// @route  GET /api/cards/:id/quiz/results
const getResults = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    if (card.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });

    const quiz = await Quiz.findOne({ card: card._id }).populate('attempts.student', 'name email');
    if (!quiz) return res.status(404).json({ message: 'No quiz found' });

    res.json({ title: quiz.title, attempts: quiz.attempts });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Error fetching results' });
  }
};

// @desc   Delete quiz
// @route  DELETE /api/cards/:id/quiz
const deleteQuiz = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    if (card.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });

    await Quiz.findOneAndDelete({ card: card._id });
    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Error deleting quiz' });
  }
};

module.exports = { createQuiz, getQuiz, submitQuiz, getResults, deleteQuiz };
