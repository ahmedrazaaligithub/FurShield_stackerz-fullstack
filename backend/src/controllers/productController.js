const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    const sortOptions = {};
    switch (req.query.sort) {
      case 'price_asc':
        sortOptions.price = 1;
        break;
      case 'price_desc':
        sortOptions.price = -1;
        break;
      case 'rating':
        sortOptions['ratings.average'] = -1;
        break;
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      default:
        sortOptions.isFeatured = -1;
        sortOptions.createdAt = -1;
    }

    const products = await Product.find(filter)
      .populate('vendor', 'name')
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'name profile')
      .populate('reviews');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const productData = {
      ...req.body,
      vendor: req.user.id
    };
    
    // Ensure images array contains proper paths
    if (productData.images && Array.isArray(productData.images)) {
      productData.images = productData.images.map(img => {
        if (typeof img === 'string' && !img.startsWith('/')) {
          return `/uploads/products/${img}`;
        }
        return img;
      });
    }
    
    const product = await Product.create(productData);

    await product.populate('vendor', 'name');

    await AuditLog.create({
      user: req.user._id,
      action: 'product_creation',
      resource: 'product',
      resourceId: product._id.toString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    if (product.vendor && product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this product'
      });
    }
    
    const updateData = { ...req.body };
    
    // Ensure images array contains proper paths
    if (updateData.images && Array.isArray(updateData.images)) {
      updateData.images = updateData.images.map(img => {
        if (typeof img === 'string' && !img.startsWith('/')) {
          return `/uploads/products/${img}`;
        }
        return img;
      });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('vendor', 'name');

    await AuditLog.create({
      user: req.user._id,
      action: 'product_update',
      resource: 'product',
      resourceId: req.params.id,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    if (product.vendor && product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this product'
      });
    }

    product.isActive = false;
    await product.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'product_deletion',
      resource: 'product',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

const updateInventory = async (req, res, next) => {
  try {
    const { quantity, operation } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    if (product.vendor && product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update inventory for this product'
      });
    }

    if (operation === 'add') {
      product.inventory.quantity += quantity;
    } else if (operation === 'subtract') {
      product.inventory.quantity = Math.max(0, product.inventory.quantity - quantity);
    } else {
      product.inventory.quantity = quantity;
    }

    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  updateInventory
};
