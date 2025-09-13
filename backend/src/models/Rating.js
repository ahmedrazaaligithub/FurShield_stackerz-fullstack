const mongoose = require('mongoose');
const ratingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  target: {
    type: mongoose.Schema.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  targetType: {
    type: String,
    required: true,
    enum: ['User', 'Shelter', 'Product']
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  comment: {
    type: String,
    maxlength: [300, 'Comment cannot be more than 300 characters']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  moderatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  moderationReason: String,
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }]
  },
  reported: {
    count: {
      type: Number,
      default: 0
    },
    reasons: [String]
  },
  response: {
    text: String,
    respondedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, {
  timestamps: true
});
ratingSchema.index({ target: 1, targetType: 1 });
ratingSchema.index({ user: 1 });
ratingSchema.index({ rating: 1 });
ratingSchema.index({ createdAt: -1 });
ratingSchema.index({ user: 1, target: 1, targetType: 1 }, { unique: true });
module.exports = mongoose.model('Rating', ratingSchema);