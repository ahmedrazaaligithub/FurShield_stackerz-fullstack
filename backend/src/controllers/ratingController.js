const Rating = require('../models/Rating');
const User = require('../models/User');
const Shelter = require('../models/Shelter');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const getRatings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.target) filter.target = req.query.target;
    if (req.query.targetType) filter.targetType = req.query.targetType;
    if (req.query.rating) filter.rating = parseInt(req.query.rating);
    const ratings = await Rating.find(filter)
      .populate('user', 'name avatar')
      .populate('target')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await Rating.countDocuments(filter);
    res.json({
      success: true,
      data: ratings,
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
const getRating = async (req, res, next) => {
  try {
    const rating = await Rating.findById(req.params.id)
      .populate('user', 'name avatar')
      .populate('target')
      .populate('moderatedBy', 'name');
    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found'
      });
    }
    res.json({
      success: true,
      data: rating
    });
  } catch (error) {
    next(error);
  }
};
const createRating = async (req, res, next) => {
  try {
    const { targetId, targetType, rating, comment } = req.body;
    const existingRating = await Rating.findOne({
      user: req.user.id,
      target: targetId,
      targetType
    });
    if (existingRating) {
      return res.status(400).json({
        success: false,
        error: 'You have already rated this item'
      });
    }
    let targetModel;
    switch (targetType) {
      case 'User':
        targetModel = User;
        break;
      case 'Shelter':
        targetModel = Shelter;
        break;
      case 'Product':
        targetModel = Product;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid target type'
        });
    }
    const target = await targetModel.findById(targetId);
    if (!target) {
      return res.status(404).json({
        success: false,
        error: 'Target not found'
      });
    }
    const newRating = await Rating.create({
      user: req.user.id,
      target: targetId,
      targetType,
      rating,
      comment
    });
    await newRating.populate('user', 'name avatar');
    await updateTargetRating(targetId, targetType);
    await AuditLog.create({
      user: req.user._id,
      action: 'rating_creation',
      resource: 'rating',
      resourceId: newRating._id.toString(),
      details: { targetId, targetType, rating },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(201).json({
      success: true,
      data: newRating
    });
  } catch (error) {
    next(error);
  }
};
const updateRating = async (req, res, next) => {
  try {
    let rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found'
      });
    }
    if (rating.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this rating'
      });
    }
    rating = await Rating.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name avatar');
    await updateTargetRating(rating.target, rating.targetType);
    await AuditLog.create({
      user: req.user._id,
      action: 'rating_update',
      resource: 'rating',
      resourceId: req.params.id,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: rating
    });
  } catch (error) {
    next(error);
  }
};
const deleteRating = async (req, res, next) => {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found'
      });
    }
    if (rating.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this rating'
      });
    }
    await Rating.findByIdAndDelete(req.params.id);
    await updateTargetRating(rating.target, rating.targetType);
    await AuditLog.create({
      user: req.user._id,
      action: 'rating_deletion',
      resource: 'rating',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
const markHelpful = async (req, res, next) => {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found'
      });
    }
    if (rating.helpful.users.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'You have already marked this rating as helpful'
      });
    }
    rating.helpful.users.push(req.user.id);
    rating.helpful.count += 1;
    await rating.save();
    res.json({
      success: true,
      message: 'Rating marked as helpful'
    });
  } catch (error) {
    next(error);
  }
};
const reportRating = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found'
      });
    }
    rating.reported.count += 1;
    rating.reported.reasons.push(reason);
    await rating.save();
    await AuditLog.create({
      user: req.user._id,
      action: 'rating_report',
      resource: 'rating',
      resourceId: req.params.id,
      details: { reason },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Rating reported successfully'
    });
  } catch (error) {
    next(error);
  }
};
const moderateRating = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found'
      });
    }
    rating.isModerated = true;
    rating.moderatedBy = req.user.id;
    rating.moderationReason = reason;
    if (action === 'remove') {
      await Rating.findByIdAndDelete(req.params.id);
      await updateTargetRating(rating.target, rating.targetType);
    } else {
      await rating.save();
    }
    await AuditLog.create({
      user: req.user._id,
      action: 'rating_moderation',
      resource: 'rating',
      resourceId: req.params.id,
      details: { action, reason },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: `Rating ${action}d successfully`
    });
  } catch (error) {
    next(error);
  }
};
const updateTargetRating = async (targetId, targetType) => {
  try {
    const ratings = await Rating.find({ target: targetId, targetType });
    if (ratings.length === 0) {
      return;
    }
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = totalRating / ratings.length;
    let targetModel;
    switch (targetType) {
      case 'User':
        targetModel = User;
        break;
      case 'Shelter':
        targetModel = Shelter;
        break;
      case 'Product':
        targetModel = Product;
        break;
      default:
        return;
    }
    await targetModel.findByIdAndUpdate(targetId, {
      'ratings.average': Math.round(averageRating * 10) / 10,
      'ratings.count': ratings.length
    });
  } catch (error) {
    console.error('Error updating target rating:', error);
  }
};
module.exports = {
  getRatings,
  getRating,
  createRating,
  updateRating,
  deleteRating,
  markHelpful,
  reportRating,
  moderateRating
};