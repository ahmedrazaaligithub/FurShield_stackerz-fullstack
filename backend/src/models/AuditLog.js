const mongoose = require('mongoose');
const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: [true, 'Please specify the action'],
    maxlength: [100, 'Action cannot be more than 100 characters']
  },
  resource: {
    type: String,
    required: [true, 'Please specify the resource'],
    maxlength: [50, 'Resource cannot be more than 50 characters']
  },
  resourceId: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: String,
  userAgent: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  },
  errorMessage: String
}, {
  timestamps: true
});
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resource: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1 });
module.exports = mongoose.model('AuditLog', auditLogSchema);