const mongoose = require('mongoose');
const adoptionListingSchema = new mongoose.Schema({
  pet: {
    type: mongoose.Schema.ObjectId,
    ref: 'Pet',
    required: true
  },
  shelter: {
    type: mongoose.Schema.ObjectId,
    ref: 'Shelter',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  requirements: {
    type: String,
    maxlength: [500, 'Requirements cannot be more than 500 characters']
  },
  adoptionFee: {
    type: Number,
    min: [0, 'Adoption fee cannot be negative'],
    max: [10000, 'Adoption fee cannot be more than 10000']
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'adopted', 'withdrawn'],
    default: 'available'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  specialNeeds: {
    type: Boolean,
    default: false
  },
  specialNeedsDescription: String,
  goodWith: {
    children: {
      type: Boolean,
      default: false
    },
    dogs: {
      type: Boolean,
      default: false
    },
    cats: {
      type: Boolean,
      default: false
    }
  },
  energyLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large']
  },
  photos: [String],
  videos: [String],
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  inquiries: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    message: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'withdrawn'],
      default: 'pending'
    },
    applicationForm: {
      experience: String,
      livingSpace: String,
      otherPets: String,
      workSchedule: String,
      references: [String],
      veterinarian: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  adoptedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  adoptedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
adoptionListingSchema.index({ shelter: 1 });
adoptionListingSchema.index({ status: 1 });
adoptionListingSchema.index({ priority: 1 });
adoptionListingSchema.index({ featured: 1 });
adoptionListingSchema.index({ createdAt: -1 });
module.exports = mongoose.model('AdoptionListing', adoptionListingSchema);