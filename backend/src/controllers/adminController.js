const User = require('../models/User');
const PaymentProvider = require('../models/PaymentProvider');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AdoptionListing = require('../models/AdoptionListing');
const Shelter = require('../models/Shelter');
const paymentService = require('../services/paymentService');
const { emitToAdmins, broadcastToAll } = require('../sockets/socketHandler');

const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalVets = await User.countDocuments({ role: 'vet', isActive: true });
    const verifiedVets = await User.countDocuments({ role: 'vet', isVerified: true, isActive: true });
    const totalShelters = await Shelter.countDocuments({ isActive: true });
    const verifiedShelters = await Shelter.countDocuments({ isVerified: true, isActive: true });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const activeAdoptions = await AdoptionListing.countDocuments({ status: 'available', isActive: true });
    const completedAdoptions = await AdoptionListing.countDocuments({ status: 'adopted' });

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find({ isActive: true })
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalVets,
          verifiedVets,
          totalShelters,
          verifiedShelters,
          totalProducts,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          activeAdoptions,
          completedAdoptions
        },
        recentOrders,
        recentUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentProviders = async (req, res, next) => {
  try {
    const providers = await PaymentProvider.find()
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    next(error);
  }
};

const addPaymentProvider = async (req, res, next) => {
  try {
    const providerData = {
      ...req.body,
      addedBy: req.user.id
    };

    const provider = await paymentService.addProvider(providerData);

    await AuditLog.create({
      user: req.user._id,
      action: 'payment_provider_addition',
      resource: 'payment_provider',
      resourceId: provider._id.toString(),
      details: { name: provider.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (global.io) {
      broadcastToAll(global.io, 'payment_provider_added', {
        provider: {
          id: provider._id,
          name: provider.name,
          supportedMethods: provider.supportedMethods
        }
      });
    }

    res.status(201).json({
      success: true,
      data: provider
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentProvider = async (req, res, next) => {
  try {
    const provider = await PaymentProvider.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Payment provider not found'
      });
    }

    await paymentService.loadProviders();

    await AuditLog.create({
      user: req.user._id,
      action: 'payment_provider_update',
      resource: 'payment_provider',
      resourceId: req.params.id,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    next(error);
  }
};

const removePaymentProvider = async (req, res, next) => {
  try {
    await paymentService.removeProvider(req.params.id);

    await AuditLog.create({
      user: req.user._id,
      action: 'payment_provider_removal',
      resource: 'payment_provider',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Payment provider removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.resource) filter.resource = req.query.resource;
    if (req.query.user) filter.user = req.query.user;
    if (req.query.severity) filter.severity = req.query.severity;

    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs,
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

const sendBroadcastNotification = async (req, res, next) => {
  try {
    const { title, message, priority, targetRoles } = req.body;

    const filter = { isActive: true };
    if (targetRoles && targetRoles.length > 0) {
      filter.role = { $in: targetRoles };
    }

    const users = await User.find(filter);

    for (const user of users) {
      await Notification.create({
        recipient: user._id,
        sender: req.user.id,
        title,
        message,
        type: 'system',
        priority: priority || 'medium'
      });
    }

    if (global.io) {
      if (targetRoles && targetRoles.length > 0) {
        users.forEach(user => {
          global.io.to(`user_${user._id}`).emit('admin_broadcast', {
            title,
            message,
            priority
          });
        });
      } else {
        broadcastToAll(global.io, 'admin_broadcast', {
          title,
          message,
          priority
        });
      }
    }

    await AuditLog.create({
      user: req.user._id,
      action: 'broadcast_notification',
      resource: 'notification',
      resourceId: 'broadcast',
      details: { title, targetRoles, userCount: users.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: `Broadcast sent to ${users.length} users`
    });
  } catch (error) {
    next(error);
  }
};

const getSystemHealth = async (req, res, next) => {
  try {
    const dbStatus = 'connected';
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    const activeConnections = global.io ? global.io.engine.clientsCount : 0;
    
    const recentErrors = await AuditLog.find({
      status: 'failure',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).countDocuments();

    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const failedPayments = await Order.countDocuments({ paymentStatus: 'failed' });

    res.json({
      success: true,
      data: {
        database: dbStatus,
        uptime: Math.floor(uptime),
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
        },
        activeConnections,
        recentErrors,
        pendingOrders,
        failedPayments,
        timestamp: new Date().toISOString()
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

module.exports = {
  getDashboardStats,
  getPaymentProviders,
  addPaymentProvider,
  updatePaymentProvider,
  removePaymentProvider,
  getAuditLogs,
  sendBroadcastNotification,
  getSystemHealth,
  manageUser
};
