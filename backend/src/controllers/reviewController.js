const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const reviews = await Review.find({ product: productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Review.countDocuments({ product: productId });
    const ratingStats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratings: {
            $push: '$rating'
          }
        }
      }
    ]);
    const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0, ratings: [] };
    const ratingDistribution = {
      5: stats.ratings.filter(r => r === 5).length,
      4: stats.ratings.filter(r => r === 4).length,
      3: stats.ratings.filter(r => r === 3).length,
      2: stats.ratings.filter(r => r === 2).length,
      1: stats.ratings.filter(r => r === 1).length
    };
    res.json({
      success: true,
      data: {
        reviews,
        stats: {
          averageRating: Math.round(stats.averageRating * 10) / 10,
          totalReviews: stats.totalReviews,
          distribution: ratingDistribution
        },
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
const createReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment, productId: bodyProductId } = req.body;
    const userId = req.user.id;
    const finalProductId = productId || bodyProductId;
    console.log('Review request body:', req.body);
    console.log('Rating value:', rating, 'Type:', typeof rating);
    const numericRating = Number(rating);
    console.log('Numeric rating:', numericRating, 'IsNaN:', isNaN(numericRating));
    if (rating === undefined || rating === null || rating === '' || isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      console.log('Rating validation failed');
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Review comment is required'
      });
    }
    if (!finalProductId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    const product = await Product.findById(finalProductId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    const existingReview = await Review.findOne({ product: finalProductId, user: userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this product'
      });
    }
    const hasPurchased = await Order.findOne({
      user: userId,
      'items.product': finalProductId,
      status: 'delivered'
    });
    const review = await Review.create({
      product: finalProductId,
      user: userId,
      rating: numericRating,
      title,
      comment,
      verified: !!hasPurchased
    });
    await review.populate('user', 'name avatar');
    await updateProductRating(finalProductId);
    await AuditLog.create({
      user: userId,
      action: 'review_create',
      resource: 'review',
      resourceId: review._id,
      details: { productId: finalProductId, rating: numericRating },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};
const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own reviews'
      });
    }
    review.rating = rating;
    review.title = title;
    review.comment = comment;
    await review.save();
    await review.populate('user', 'name avatar');
    await updateProductRating(review.product);
    await AuditLog.create({
      user: userId,
      action: 'review_update',
      resource: 'review',
      resourceId: review._id,
      details: { rating, title },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};
const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    if (review.user.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own reviews'
      });
    }
    const productId = review.product;
    await Review.findByIdAndDelete(reviewId);
    await updateProductRating(productId);
    await AuditLog.create({
      user: userId,
      action: 'review_delete',
      resource: 'review',
      resourceId: reviewId,
      details: { productId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  const { averageRating = 0, totalReviews = 0 } = stats[0] || {};
  await Product.findByIdAndUpdate(productId, {
    'ratings.average': Math.round(averageRating * 10) / 10,
    'ratings.count': totalReviews
  });
};
const markHelpful = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    const isAlreadyHelpful = review.helpful.includes(userId);
    if (isAlreadyHelpful) {
      review.helpful = review.helpful.filter(id => id.toString() !== userId);
    } else {
      review.helpful.push(userId);
    }
    await review.save();
    res.json({
      success: true,
      data: {
        helpful: review.helpful.length,
        isHelpful: !isAlreadyHelpful
      }
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markHelpful
};