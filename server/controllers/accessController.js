const AccessRequest = require('../models/AccessRequest');
const Card = require('../models/Card');

// @desc    Student requests access to a card
// @route   POST /api/access/request/:cardId
const requestAccess = async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Check if already has access
    if (card.accessList.includes(req.user._id)) {
      return res.status(400).json({ message: 'You already have access to this card' });
    }

    // Check if already requested
    const existingRequest = await AccessRequest.findOne({
      student: req.user._id,
      card: req.params.cardId
    });

    if (existingRequest) {
      return res.status(400).json({
        message: `You already have a ${existingRequest.status} request for this card`
      });
    }

    const accessRequest = await AccessRequest.create({
      student: req.user._id,
      card: req.params.cardId,
      message: req.body.message || ''
    });

    await accessRequest.populate('student', 'name email');
    await accessRequest.populate('card', 'title subject');

    res.status(201).json(accessRequest);
  } catch (error) {
    console.error('Request access error:', error);
    res.status(500).json({ message: 'Error requesting access' });
  }
};

// @desc    Get student's own access requests
// @route   GET /api/access/my-requests
const getMyRequests = async (req, res) => {
  try {
    const requests = await AccessRequest.find({ student: req.user._id })
      .populate({
        path: 'card',
        populate: { path: 'creator', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ message: 'Error fetching requests' });
  }
};

// @desc    Get access requests for a specific card (teacher)
// @route   GET /api/access/card-requests/:cardId
const getCardRequests = async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    if (card.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const requests = await AccessRequest.find({ card: req.params.cardId })
      .populate('student', 'name email institution')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get card requests error:', error);
    res.status(500).json({ message: 'Error fetching card requests' });
  }
};

// @desc    Get ALL pending requests for the teacher's cards
// @route   GET /api/access/teacher-requests
const getTeacherRequests = async (req, res) => {
  try {
    // Find all cards by this teacher
    const teacherCards = await Card.find({ creator: req.user._id }).select('_id');
    const cardIds = teacherCards.map(c => c._id);

    const requests = await AccessRequest.find({
      card: { $in: cardIds }
    })
      .populate('student', 'name email institution')
      .populate('card', 'title subject')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get teacher requests error:', error);
    res.status(500).json({ message: 'Error fetching requests' });
  }
};

// @desc    Handle access request (approve/reject)
// @route   PUT /api/access/handle/:requestId
const handleRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const accessRequest = await AccessRequest.findById(req.params.requestId)
      .populate('card');

    if (!accessRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify the teacher owns this card
    if (accessRequest.card.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to handle this request' });
    }

    accessRequest.status = status;
    await accessRequest.save();

    // If approved, add student to card's access list
    if (status === 'approved') {
      await Card.findByIdAndUpdate(accessRequest.card._id, {
        $addToSet: { accessList: accessRequest.student }
      });
    }

    await accessRequest.populate('student', 'name email');

    res.json(accessRequest);
  } catch (error) {
    console.error('Handle request error:', error);
    res.status(500).json({ message: 'Error handling request' });
  }
};

// @desc    Revoke a student's access
// @route   DELETE /api/access/revoke/:cardId/:userId
const revokeAccess = async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    if (card.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove from access list
    await Card.findByIdAndUpdate(req.params.cardId, {
      $pull: { accessList: req.params.userId }
    });

    // Update the access request status
    await AccessRequest.findOneAndUpdate(
      { student: req.params.userId, card: req.params.cardId },
      { status: 'rejected' }
    );

    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    console.error('Revoke access error:', error);
    res.status(500).json({ message: 'Error revoking access' });
  }
};

module.exports = { requestAccess, getMyRequests, getCardRequests, getTeacherRequests, handleRequest, revokeAccess };
