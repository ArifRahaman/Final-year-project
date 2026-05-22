const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: true,
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  }
}, { timestamps: true });

chatMessageSchema.index({ card: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
