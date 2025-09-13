const mongoose = require('mongoose')
const feedbackSchema = new mongoose.Schema({
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['professional_advice', 'care_tip', 'experience_share'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reportCount: {
    type: Number,
    default: 0
  },
  reportedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
})
feedbackSchema.index({ pet: 1, createdAt: -1 })
feedbackSchema.index({ user: 1 })
feedbackSchema.index({ type: 1 })
feedbackSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name role avatar'
  })
  next()
})
module.exports = mongoose.model('Feedback', feedbackSchema)