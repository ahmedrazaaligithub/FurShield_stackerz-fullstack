const mongoose = require('mongoose');
const documentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  pet: {
    type: mongoose.Schema.ObjectId,
    ref: 'Pet',
    required: true
  },
  type: {
    type: String,
    enum: ['vet-certificate', 'lab-report', 'insurance-document', 'vaccination-record', 'medical-report', 'x-ray', 'prescription', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['medical', 'insurance', 'legal', 'identification', 'other'],
    default: 'medical'
  },
  title: {
    type: String,
    required: [true, 'Please add a document title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
    max: [10 * 1024 * 1024, 'File size cannot exceed 10MB']
  },
  url: {
    type: String,
    required: true
  },
  cloudinaryPublicId: String,
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  issuedDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  issuedBy: {
    type: String,
    maxlength: [100, 'Issued by cannot be more than 100 characters']
  },
  tags: [String],
  isPrivate: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    veterinarian: String,
    clinic: String,
    testType: String,
    results: String,
    insuranceProvider: String,
    policyNumber: String,
    claimNumber: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
documentSchema.index({ owner: 1 });
documentSchema.index({ pet: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ issuedDate: -1 });
documentSchema.virtual('fileExtension').get(function() {
  return this.originalName.split('.').pop().toLowerCase();
});
documentSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});
documentSchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});
module.exports = mongoose.model('Document', documentSchema);