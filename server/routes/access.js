const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  requestAccess, getMyRequests, getCardRequests, getTeacherRequests, handleRequest, revokeAccess
} = require('../controllers/accessController');

const router = express.Router();

// Student routes
router.post('/request/:cardId', protect, authorize('student'), requestAccess);
router.get('/my-requests', protect, authorize('student'), getMyRequests);

// Teacher routes
router.get('/teacher-requests', protect, authorize('teacher'), getTeacherRequests);
router.get('/card-requests/:cardId', protect, authorize('teacher'), getCardRequests);
router.put('/handle/:requestId', protect, authorize('teacher'), handleRequest);
router.delete('/revoke/:cardId/:userId', protect, authorize('teacher'), revokeAccess);

module.exports = router;
