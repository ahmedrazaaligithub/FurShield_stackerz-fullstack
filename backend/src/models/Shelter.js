const mongoose = require('mongoose');
const shelterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a shelter name'],
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  phone: {
    type: String,
    match: [/^\+?[1-9]\d{7,14}$/, 'Please add a valid phone number']
  },
  email: {
    type: String,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please add a valid email']
  },
  website: String,
  capacity: {
    type: Number,
    min: [1, 'Capacity must be at least 1']
  },
  currentOccupancy: {
    type: Number,
    default: 0
  },
  services: [{
    type: String,
    enum: ['adoption', 'fostering', 'medical-care', 'grooming', 'training', 'boarding']
  }],
  operatingHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean }
  },
  photos: [String],
  documents: [{
    type: String,
    filename: String,
    originalName: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date,
  licenseNumber: String,
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String
  },
  donationInfo: {
    acceptsDonations: {
      type: Boolean,
      default: true
    },
    paymentMethods: [String],
    wishList: [String]
  },
  stats: {
    totalAdoptions: {
      type: Number,
      default: 0
    },
    totalRescues: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
shelterSchema.virtual('adoptionListings', {
  ref: 'AdoptionListing',
  localField: '_id',
  foreignField: 'shelter',
  justOne: false
});
shelterSchema.virtual('ratings', {
  ref: 'Rating',
  localField: '_id',
  foreignField: 'target',
  justOne: false
});
shelterSchema.index({ location: '2dsphere' });
shelterSchema.index({ user: 1 });
shelterSchema.index({ isVerified: 1 });
shelterSchema.index({ 'address.city': 1 });
module.exports = mongoose.model('Shelter', shelterSchema);