const Card = require('../models/Card');
const AccessRequest = require('../models/AccessRequest');
const User = require('../models/User');

// @desc    Get dashboard statistics based on user role
// @route   GET /api/users/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    if (role === 'teacher') {
      const totalCards = await Card.countDocuments({ creator: userId });
      const teacherCards = await Card.find({ creator: userId }).select('_id');
      const cardIds = teacherCards.map(c => c._id);

      const pendingRequests = await AccessRequest.countDocuments({
        card: { $in: cardIds },
        status: 'pending'
      });

      const approvedRequests = await AccessRequest.countDocuments({
        card: { $in: cardIds },
        status: 'approved'
      });

      const totalStudents = await Card.aggregate([
        { $match: { creator: userId } },
        { $project: { accessCount: { $size: '$accessList' } } },
        { $group: { _id: null, total: { $sum: '$accessCount' } } }
      ]);

      res.json({
        role: 'teacher',
        totalCards,
        pendingRequests,
        approvedRequests,
        totalStudentsWithAccess: totalStudents[0]?.total || 0
      });
    } else {
      // Student
      const pendingRequests = await AccessRequest.countDocuments({
        student: userId,
        status: 'pending'
      });

      const approvedCards = await AccessRequest.countDocuments({
        student: userId,
        status: 'approved'
      });

      const totalCards = await Card.countDocuments({ isPublished: true });

      res.json({
        role: 'student',
        pendingRequests,
        approvedCards,
        totalAvailableCards: totalCards
      });
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};

module.exports = { getDashboardStats };
