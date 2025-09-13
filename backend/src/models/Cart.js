const mongoose = require('mongoose');
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, {
  timestamps: true
});
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  coupon: {
    code: {
      type: String,
      uppercase: true
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.product': 1 });
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => {
    if (item.product && item.product.price) {
      return total + (item.product.price * item.quantity);
    }
    return total;
  }, 0);
});
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });
cartSchema.pre('save', function(next) {
  this.items = this.items.filter(item => item.quantity > 0);
  next();
});
module.exports = mongoose.model('Cart', cartSchema);