const express = require('express');
const { protect } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/userController');

const router = express.Router();

router.get('/dashboard-stats', protect, getDashboardStats);

module.exports = router;
