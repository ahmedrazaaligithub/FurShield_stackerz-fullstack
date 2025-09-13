const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = { isActive: true };
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) {
      if (req.query.status === 'active') filter.isActive = true;
      if (req.query.status === 'inactive') filter.isActive = false;
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
const manageUser = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    switch (action) {
      case 'activate':
        user.isActive = true;
        break;
      case 'deactivate':
        user.isActive = false;
        break;
      case 'verify':
        user.isVerified = true;
        break;
      case 'unverify':
        user.isVerified = false;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }
    await user.save();
    await AuditLog.create({
      user: req.user._id,
      action: `user_${action}`,
      resource: 'user',
      resourceId: req.params.userId,
      details: { reason },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: `User ${action}d successfully`
    });
  } catch (error) {
    next(error);
  }
};
const updateUser = async (req, res, next) => {
  try {
    const { role, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    if (role) user.role = role;
    if (status) {
      user.isActive = status === 'active';
    }
    await user.save();
    await AuditLog.create({
      user: req.user._id,
      action: 'user_update',
      resource: 'user',
      resourceId: req.params.id,
      details: { role, status },
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
      action: 'user_deactivate',
      resource: 'user',
      resourceId: req.params.id,
      details: { reason: 'Admin deletion' },
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
module.exports = {
  getUsers,
  manageUser,
  updateUser,
  deleteUser
};