const ChatMessage = require('../models/ChatMessage');
const Card = require('../models/Card');

// @desc   Get messages for a card (paginated)
// @route  GET /api/cards/:id/chat
const getMessages = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const isOwner = card.creator.toString() === req.user._id.toString();
    const hasAccess = isOwner || card.accessList.some(u => u.toString() === req.user._id.toString());
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await ChatMessage.find({ card: req.params.id })
      .populate('author', 'name role avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await ChatMessage.countDocuments({ card: req.params.id });

    res.json({ messages, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

// @desc   Post a message to a card's discussion
// @route  POST /api/cards/:id/chat
const postMessage = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const isOwner = card.creator.toString() === req.user._id.toString();
    const hasAccess = isOwner || card.accessList.some(u => u.toString() === req.user._id.toString());
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    const { content } = req.body;
    if (!content || !content.trim())
      return res.status(400).json({ message: 'Message content is required' });

    const message = await ChatMessage.create({
      card: req.params.id,
      author: req.user._id,
      content: content.trim()
    });

    await message.populate('author', 'name role avatar');
    res.status(201).json(message);
  } catch (error) {
    console.error('Post message error:', error);
    res.status(500).json({ message: 'Error posting message' });
  }
};

// @desc   Delete a message (author or card owner only)
// @route  DELETE /api/cards/:id/chat/:msgId
const deleteMessage = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const message = await ChatMessage.findById(req.params.msgId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const isOwner = card.creator.toString() === req.user._id.toString();
    const isAuthor = message.author.toString() === req.user._id.toString();
    if (!isOwner && !isAuthor) return res.status(403).json({ message: 'Not authorised' });

    await ChatMessage.findByIdAndDelete(req.params.msgId);
    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
};

module.exports = { getMessages, postMessage, deleteMessage };
