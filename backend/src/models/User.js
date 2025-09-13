const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [10, 'Password must be at least 10 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['owner', 'vet', 'shelter', 'admin'],
    default: 'owner'
  },
  phone: {
    type: String,
    match: [/^\+?[1-9][\d\s]{6,14}$/, 'Please add a valid phone number']
  },
  address: {
    type: String,
    maxlength: [200, 'Address cannot be more than 200 characters']
  },
  avatar: {
    type: String,
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isVetVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastLogin: Date,
  profile: {
    bio: String,
    location: String,
    website: String,
    specialization: [String], 
    licenseNumber: String,
    experience: Number,
    clinicName: String,
    clinicAddress: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number], 
        index: '2dsphere'
      }
    },
    availableHours: {
      monday: { start: String, end: String, available: { type: Boolean, default: false } },
      tuesday: { start: String, end: String, available: { type: Boolean, default: false } },
      wednesday: { start: String, end: String, available: { type: Boolean, default: false } },
      thursday: { start: String, end: String, available: { type: Boolean, default: false } },
      friday: { start: String, end: String, available: { type: Boolean, default: false } },
      saturday: { start: String, end: String, available: { type: Boolean, default: false } },
      sunday: { start: String, end: String, available: { type: Boolean, default: false } }
    },
    consultationFee: Number,
    languages: [String],
    conditions: [String] 
  },
  favoriteVets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.isEmailVerified = doc.isEmailVerified;
      return ret;
    }
  },
  toObject: { virtuals: true }
});
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};
userSchema.methods.getRefreshToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });
};
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ 'profile.coordinates': '2dsphere' });
userSchema.index({ 'profile.specialization': 1 });
userSchema.index({ 'profile.location': 1 });
module.exports = mongoose.model('User', userSchema);