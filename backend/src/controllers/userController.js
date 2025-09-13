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
  console.log('avatarUrl------------------------------->',req.body);
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        error: 'Please provide avatar URL'
      });
    }
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
      details: { avatarUrl },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: user,
      message: 'Avatar updated successfully'
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
    if (req.query.verified === 'true') filter.isVetVerified = true;
    if (req.query.specialization) {
      filter['profile.specialization'] = { $regex: req.query.specialization, $options: 'i' };
    }
    if (req.query.location) {
      filter.$or = [
        { 'profile.location': { $regex: req.query.location, $options: 'i' } },
        { 'address': { $regex: req.query.location, $options: 'i' } }
      ];
    }
    let aggregationPipeline = [];
    if (req.query.latitude && req.query.longitude && req.query.radius) {
      const lat = parseFloat(req.query.latitude);
      const lng = parseFloat(req.query.longitude);
      const radius = parseFloat(req.query.radius) || 50; 
      aggregationPipeline = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [lng, lat]
            },
            distanceField: "distance",
            maxDistance: radius * 1000, 
            spherical: true,
            query: filter
          }
        },
        { $skip: skip },
        { $limit: limit },
        { $sort: { isVetVerified: -1, distance: 1 } },
        {
          $project: {
            password: 0,
            distance: { $round: [{ $divide: ["$distance", 1000] }, 2] } 
          }
        }
      ];
    }
    if (req.query.condition) {
      const conditionSpecializations = {
        'skin': ['dermatology', 'general'],
        'dental': ['dentistry', 'oral surgery', 'general'],
        'surgery': ['surgery', 'orthopedic', 'general'],
        'emergency': ['emergency', 'critical care', 'general'],
        'cardiology': ['cardiology', 'internal medicine', 'general'],
        'orthopedic': ['orthopedic', 'surgery', 'general'],
        'oncology': ['oncology', 'internal medicine', 'general'],
        'neurology': ['neurology', 'internal medicine', 'general'],
        'ophthalmology': ['ophthalmology', 'general'],
        'reproduction': ['reproduction', 'theriogenology', 'general'],
        'behavior': ['behavior', 'psychology', 'general'],
        'exotic': ['exotic', 'avian', 'general']
      };
      const relevantSpecs = conditionSpecializations[req.query.condition.toLowerCase()] || ['general'];
      filter['profile.specialization'] = { 
        $in: relevantSpecs.map(spec => new RegExp(spec, 'i'))
      };
    }
    let vets, total;
    if (aggregationPipeline.length > 0) {
      const results = await User.aggregate(aggregationPipeline);
      vets = results;
      const countPipeline = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(req.query.longitude), parseFloat(req.query.latitude)]
            },
            distanceField: "distance",
            maxDistance: (parseFloat(req.query.radius) || 50) * 1000,
            spherical: true,
            query: filter
          }
        },
        { $count: "total" }
      ];
      const countResult = await User.aggregate(countPipeline);
      total = countResult[0]?.total || 0;
    } else {
      vets = await User.find(filter)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ isVetVerified: -1, createdAt: -1 });
      total = await User.countDocuments(filter);
    }
    res.json({
      success: true,
      data: vets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        location: req.query.location,
        specialization: req.query.specialization,
        condition: req.query.condition,
        radius: req.query.radius,
        verified: req.query.verified
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