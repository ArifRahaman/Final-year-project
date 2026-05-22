const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure a student can only have one request per card
accessRequestSchema.index({ student: 1, card: 1 }, { unique: true });

module.exports = mongoose.model('AccessRequest', accessRequestSchema);
