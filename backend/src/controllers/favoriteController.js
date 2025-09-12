const Favorite = require('../models/Favorite');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

// Get user's favorites
const getFavorites = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const favorites = await Favorite.find({ user: req.user.id })
      .populate({
        path: 'product',
        select: 'name price images category ratings inventory compareAtPrice'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Favorite.countDocuments({ user: req.user.id });

    // Filter out favorites where product might have been deleted
    const validFavorites = favorites.filter(fav => fav.product);

    res.json({
      success: true,
      data: {
        favorites: validFavorites,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add product to favorites
const addToFavorites = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
      user: userId,
      product: productId
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        error: 'Product already in favorites'
      });
    }

    // Add to favorites
    const favorite = await Favorite.create({
      user: userId,
      product: productId
    });

    await favorite.populate('product', 'name price images category ratings');

    // Create audit log
    await AuditLog.create({
      user: userId,
      action: 'ADD_TO_FAVORITES',
      resource: 'Favorite',
      resourceId: favorite._id,
      details: {
        productId,
        productName: product.name
      }
    });

    res.status(201).json({
      success: true,
      data: favorite,
      message: 'Product added to favorites'
    });
  } catch (error) {
    next(error);
  }
};

// Remove product from favorites
const removeFromFavorites = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorite.findOneAndDelete({
      user: userId,
      product: productId
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: 'Product not in favorites'
      });
    }

    // Create audit log
    await AuditLog.create({
      user: userId,
      action: 'REMOVE_FROM_FAVORITES',
      resource: 'Favorite',
      resourceId: favorite._id,
      details: {
        productId
      }
    });

    res.json({
      success: true,
      message: 'Product removed from favorites'
    });
  } catch (error) {
    next(error);
  }
};

// Toggle favorite status
const toggleFavorite = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    console.log('Toggle favorite request:', { productId, userId, body: req.body });

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
      user: userId,
      product: productId
    });

    if (existingFavorite) {
      // Remove from favorites
      await Favorite.findByIdAndDelete(existingFavorite._id);

      await AuditLog.create({
        user: userId,
        action: 'REMOVE_FROM_FAVORITES',
        resource: 'Favorite',
        resourceId: existingFavorite._id,
        details: { productId }
      });

      res.json({
        success: true,
        data: { isFavorite: false },
        message: 'Product removed from favorites'
      });
    } else {
      // Add to favorites
      const favorite = await Favorite.create({
        user: userId,
        product: productId
      });

      await AuditLog.create({
        user: userId,
        action: 'ADD_TO_FAVORITES',
        resource: 'Favorite',
        resourceId: favorite._id,
        details: {
          productId,
          productName: product.name
        }
      });

      res.status(201).json({
        success: true,
        data: { isFavorite: true },
        message: 'Product added to favorites'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Check if product is in user's favorites
const checkFavoriteStatus = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorite.findOne({
      user: userId,
      product: productId
    });

    res.json({
      success: true,
      data: {
        isFavorite: !!favorite
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get favorite products count
const getFavoritesCount = async (req, res, next) => {
  try {
    const count = await Favorite.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  checkFavoriteStatus,
  getFavoritesCount
};
