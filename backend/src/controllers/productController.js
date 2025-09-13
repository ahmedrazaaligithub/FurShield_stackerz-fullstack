const Product = require('../models/Product');
const Category = require('../models/Category');
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
      const searchTerm = req.query.search;
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ];
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
      .populate('category', 'name')
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);
    if (req.query.search) {
      const searchTerm = req.query.search;
      const categoryFilter = { ...filter };
      delete categoryFilter.$or;
      const categoryProducts = await Product.find(categoryFilter)
        .populate({
          path: 'category',
          match: { name: { $regex: searchTerm, $options: 'i' } }
        })
        .populate('vendor', 'name')
        .skip(skip)
        .limit(limit)
        .sort(sortOptions);
      const validCategoryProducts = categoryProducts.filter(product => product.category);
      const combinedProducts = [...products];
      validCategoryProducts.forEach(catProduct => {
        if (!combinedProducts.find(p => p._id.toString() === catProduct._id.toString())) {
          combinedProducts.push(catProduct);
        }
      });
      const finalProducts = combinedProducts
        .sort((a, b) => {
          if (sortOptions.price) return sortOptions.price === 1 ? a.price - b.price : b.price - a.price;
          if (sortOptions['ratings.average']) return (b.ratings?.average || 0) - (a.ratings?.average || 0);
          if (sortOptions.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
          return 0;
        })
        .slice(0, limit);
      const combinedTotal = await Product.countDocuments({
        ...filter,
        $or: [
          ...filter.$or,
          { category: { $in: await Category.find({ name: { $regex: searchTerm, $options: 'i' } }).distinct('_id') } }
        ]
      });
      return res.json({
        success: true,
        data: finalProducts,
        pagination: {
          page,
          limit,
          total: combinedTotal,
          pages: Math.ceil(combinedTotal / limit)
        }
      });
    }
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
      .populate('category', 'name')
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
    if (!productData.images) {
      productData.images = [];
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
    if (!updateData.images) {
      updateData.images = [];
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
    const categories = await Category.find({ isActive: true }).select('name description');
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
const getAllProductsAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) {
      filter.isActive = req.query.status === 'active';
    }
    const products = await Product.find(filter)
      .populate('vendor', 'name email')
      .populate('category', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
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
const getProductStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const inactiveProducts = await Product.countDocuments({ isActive: false });
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] }
    });
    res.json({
      success: true,
      data: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts,
        lowStock: lowStockProducts
      }
    });
  } catch (error) {
    next(error);
  }
};
const createProductAdmin = async (req, res, next) => {
  try {
    const productData = { ...req.body };
    if (productData.sku === '') {
      delete productData.sku;
    }
    if (productData.images && Array.isArray(productData.images)) {
      productData.images = productData.images.filter(img => img && img.trim() !== '');
    }
    const product = await Product.create(productData);
    await product.populate([
      { path: 'vendor', select: 'name email' },
      { path: 'category', select: 'name' }
    ]);
    await AuditLog.create({
      user: req.user._id,
      action: 'admin_product_creation',
      resource: 'product',
      resourceId: product._id.toString(),
      details: { name: product.name, category: product.category?.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return res.status(400).json({
        success: false,
        error: `${field.toUpperCase()} '${value}' already exists. Please use a different ${field}.`
      });
    }
    next(error);
  }
};
const updateProductAdmin = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.images && Array.isArray(updateData.images)) {
      updateData.images = updateData.images.filter(img => img && img.trim() !== '');
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'vendor', select: 'name email' },
      { path: 'category', select: 'name' }
    ]);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    await AuditLog.create({
      user: req.user._id,
      action: 'admin_product_update',
      resource: 'product',
      resourceId: req.params.id,
      details: updateData,
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
const deleteProductAdmin = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    await AuditLog.create({
      user: req.user._id,
      action: 'admin_product_deletion',
      resource: 'product',
      resourceId: req.params.id,
      details: { name: product.name },
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
module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  updateInventory,
  getAllProductsAdmin,
  getProductStats,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin
};