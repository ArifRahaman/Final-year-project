const express = require('express');
const { protect } = require('../middleware/auth');
const { getMessages, postMessage, deleteMessage } = require('../controllers/chatController');

const router = express.Router({ mergeParams: true }); // mergeParams to get :id from parent

router.get('/', protect, getMessages);
router.post('/', protect, postMessage);
router.delete('/:msgId', protect, deleteMessage);

module.exports = router;
