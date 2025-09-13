const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Please add a message'],
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  type: {
    type: String,
    enum: ['appointment', 'payment', 'adoption', 'chat', 'system', 'reminder', 'verification'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  actionUrl: String,
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isEmailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  isPushSent: {
    type: Boolean,
    default: false
  },
  pushSentAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model('Notification', notificationSchema);