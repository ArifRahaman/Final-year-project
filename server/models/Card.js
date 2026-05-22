const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['pdf', 'image', 'video', 'text', 'other'],
    required: true
  },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, default: 0 },
  mimeType: { type: String, default: '' }
}, { _id: true });

const cardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Card title is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: 1000
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  resources: [resourceSchema],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  textContent: {
    type: String,
    default: ''
  },
  embeddingsReady: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for access count
cardSchema.virtual('accessCount').get(function() {
  return this.accessList ? this.accessList.length : 0;
});

// Index for search
cardSchema.index({ title: 'text', description: 'text', subject: 'text', tags: 'text' });

module.exports = mongoose.model('Card', cardSchema);
