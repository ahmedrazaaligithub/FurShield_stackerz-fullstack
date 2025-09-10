const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendVetVerificationUpdate } = require('../services/emailService');

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isVerified) filter.isVerified = req.query.isVerified === 'true';
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
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

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'address', 'bio'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    await AuditLog.create({
      user: req.user._id,
      action: 'profile_update',
      resource: 'user',
      resourceId: req.user._id.toString(),
      details: updates,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await AuditLog.create({
      user: req.user._id,
      action: 'user_update',
      resource: 'user',
      resourceId: req.params.id,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'user_deletion',
      resource: 'user',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const verifyVet = async (req, res, next) => {
  try {
    const { vetId, status, notes } = req.body;

    const vet = await User.findById(vetId);
    if (!vet || vet.role !== 'vet') {
      return res.status(404).json({
        success: false,
        error: 'Veterinarian not found'
      });
    }

    vet.isVerified = status === 'approved';
    if (notes) {
      vet.profile.verificationNotes = notes;
    }
    await vet.save();

    await sendVetVerificationUpdate(vet, status);

    await AuditLog.create({
      user: req.user._id,
      action: 'vet_verification',
      resource: 'user',
      resourceId: vetId,
      details: { status, notes },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: `Veterinarian ${status} successfully`
    });
  } catch (error) {
    next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image'
      });
    }

    const fs = require('fs');
    const path = require('path');
    
    // Delete old avatar if it exists and is not the default
    const oldUser = await User.findById(req.user.id);
    if (oldUser.avatar && !oldUser.avatar.includes('default-avatar')) {
      const oldPath = path.join(__dirname, '../../..', oldUser.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const avatarUrl = `/uploads/profiles/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    await AuditLog.create({
      user: req.user._id,
      action: 'avatar_upload',
      resource: 'user',
      resourceId: req.user._id.toString(),
      details: { filename: req.file.filename, url: avatarUrl },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: user,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getVets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { role: 'vet', isActive: true };
    if (req.query.verified === 'true') filter.isVerified = true;
    if (req.query.specialization) {
      filter['profile.specialization'] = { $regex: req.query.specialization, $options: 'i' };
    }

    const vets = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ isVerified: -1, createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: vets,
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

module.exports = {
  getUsers,
  getUser,
  updateProfile,
  updateUser,
  deleteUser,
  verifyVet,
  uploadAvatar,
  getVets
};
