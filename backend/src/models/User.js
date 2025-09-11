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
    specialization: String,
    licenseNumber: String,
    experience: Number
  },
  favoriteVets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// userSchema.virtual('isLocked').get(function() {
//   return !!(this.lockUntil && this.lockUntil > Date.now());
// });

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

// userSchema.methods.incLoginAttempts = function() {
//   if (this.lockUntil && this.lockUntil < Date.now()) {
//     return this.updateOne({
//       $unset: { lockUntil: 1, loginAttempts: 1 }
//     });
//   }
  
//   const updates = { $inc: { loginAttempts: 1 } };
  
//   if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
//     updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
//   }
  
//   return this.updateOne(updates);
// };

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });

module.exports = mongoose.model('User', userSchema);
