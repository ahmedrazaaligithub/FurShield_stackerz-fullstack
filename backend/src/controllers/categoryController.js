const Category = require('../models/Category');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const getCategories = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.status) {
      filter.isActive = req.query.status === 'active';
    }
    const categories = await Category.find(filter)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await Category.countDocuments(filter);
    res.json({
      success: true,
      data: categories,
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
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const categoryData = {
      name,
      description,
      createdBy: req.user._id
    };
    const category = await Category.create(categoryData);
    await AuditLog.create({
      user: req.user._id,
      action: 'category_creation',
      resource: 'category',
      resourceId: category._id.toString(),
      details: { name: category.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }
    next(error);
  }
};
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    const updateData = { updatedBy: req.user._id };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    await AuditLog.create({
      user: req.user._id,
      action: 'category_update',
      resource: 'category',
      resourceId: req.params.id,
      details: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }
    next(error);
  }
};
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. It has ${productCount} products associated with it.`
      });
    }
    await Category.findByIdAndDelete(req.params.id);
    await AuditLog.create({
      user: req.user._id,
      action: 'category_deletion',
      resource: 'category',
      resourceId: req.params.id,
      details: { name: category.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
const getCategoryStats = async (req, res, next) => {
  try {
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    const inactiveCategories = await Category.countDocuments({ isActive: false });
    const categoriesWithProducts = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products'
        }
      },
      {
        $project: {
          name: 1,
          productCount: { $size: '$products' }
        }
      },
      {
        $sort: { productCount: -1 }
      },
      {
        $limit: 5
      }
    ]);
    res.json({
      success: true,
      data: {
        totalCategories,
        activeCategories,
        inactiveCategories,
        topCategories: categoriesWithProducts
      }
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
};