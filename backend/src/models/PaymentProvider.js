const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');
const paymentProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a provider name'],
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  publicKey: {
    type: String,
    required: [true, 'Please add a public key']
  },
  secretKey: {
    type: String,
    required: [true, 'Please add a secret key'],
    set: encrypt,
    get: decrypt
  },
  sandboxMode: {
    type: Boolean,
    default: true
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  supportedMethods: [{
    type: String,
    enum: ['credit-card', 'debit-card', 'paypal', 'bank-transfer', 'digital-wallet']
  }],
  fees: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 2.9
    },
    fixed: {
      type: Number,
      min: 0,
      default: 0.30
    }
  },
  limits: {
    minimum: {
      type: Number,
      default: 0.50
    },
    maximum: {
      type: Number,
      default: 10000
    }
  },
  addedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});
paymentProviderSchema.index({ name: 1 });
paymentProviderSchema.index({ isActive: 1 });
module.exports = mongoose.model('PaymentProvider', paymentProviderSchema);