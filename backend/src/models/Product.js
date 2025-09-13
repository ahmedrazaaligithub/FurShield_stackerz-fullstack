const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'Please add a category']
  },
  subcategory: String,
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative']
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare at price cannot be negative']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  barcode: String,
  brand: String,
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  images: [String],
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    trackQuantity: {
      type: Boolean,
      default: true
    }
  },
  variants: [{
    name: String,
    value: String,
    price: Number,
    sku: String,
    inventory: {
      quantity: Number,
      lowStockThreshold: Number
    }
  }],
  tags: [String],
  seoTitle: String,
  seoDescription: String,
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  requiresShipping: {
    type: Boolean,
    default: true
  },
  taxable: {
    type: Boolean,
    default: true
  },
  vendor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  sales: {
    totalSold: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
productSchema.virtual('reviews', {
  ref: 'Rating',
  localField: '_id',
  foreignField: 'target',
  justOne: false
});
productSchema.virtual('inStock').get(function() {
  return this.inventory.quantity > 0;
});
productSchema.virtual('lowStock').get(function() {
  return this.inventory.quantity <= this.inventory.lowStockThreshold;
});
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });
module.exports = mongoose.model('Product', productSchema);