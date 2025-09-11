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
const { sendEmail } = require('../services/emailService');

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
        totalUsers,
        totalVets,
        verifiedVets,
        totalShelters,
        verifiedShelters,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        activeAdoptions,
        completedAdoptions,
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

const getPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.search) {
      filter.transactionId = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    const payments = await Order.find(filter)
      .populate('user', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: payments,
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

const getPaymentStats = async (req, res, next) => {
  try {
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const pendingCount = await Order.countDocuments({ paymentStatus: 'pending' });
    const todayCount = await Order.countDocuments({
      paymentStatus: 'paid',
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const failedCount = await Order.countDocuments({ paymentStatus: 'failed' });

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingCount,
        todayCount,
        failedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    await AuditLog.create({
      user: req.user._id,
      action: 'payment_status_update',
      resource: 'payment',
      resourceId: req.params.id,
      details: { status },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

const getAuditStats = async (req, res, next) => {
  try {
    const totalEvents = await AuditLog.countDocuments();
    const highSeverityCount = await AuditLog.countDocuments({ severity: 'high' });
    const todayCount = await AuditLog.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const activeUsers = await User.countDocuments({ 
      isActive: true,
      lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        totalEvents,
        highSeverityCount,
        todayCount,
        activeUsers
      }
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

// Get pending approvals (shelters and vets)
const getPendingApprovals = async (req, res, next) => {
  try {
    const pendingShelters = await Shelter.find({ 
      isVerified: false, 
      isActive: true 
    }).sort({ createdAt: -1 });

    const pendingVets = await User.find({ 
      role: 'vet', 
      isVerified: false, 
      isActive: true 
    }).select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        shelters: pendingShelters,
        vets: pendingVets
      }
    });
  } catch (error) {
    next(error);
  }
};

// Approve shelter
const approveShelter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const shelter = await Shelter.findById(id);
    if (!shelter) {
      return res.status(404).json({
        success: false,
        error: 'Shelter not found'
      });
    }

    if (shelter.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Shelter is already verified'
      });
    }

    shelter.isVerified = true;
    shelter.verifiedAt = new Date();
    shelter.verifiedBy = req.user._id;
    if (notes) shelter.approvalNotes = notes;
    await shelter.save();

    // Send approval email
    if (shelter.email) {
      await sendEmail({
        email: shelter.email,
        subject: 'Shelter Application Approved - FurShield',
        message: `Congratulations! Your shelter "${shelter.name}" has been approved and verified on FurShield. You can now start managing adoption listings and connecting with pet owners.`
      });
    }

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'shelter_approval',
      resource: 'shelter',
      resourceId: shelter._id.toString(),
      details: { shelterName: shelter.name, notes },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Send notification to admins
    emitToAdmins('shelter_approved', {
      shelter: shelter.name,
      approvedBy: req.user.name
    });

    res.json({
      success: true,
      message: 'Shelter approved successfully',
      data: shelter
    });
  } catch (error) {
    next(error);
  }
};

// Reject shelter
const rejectShelter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const shelter = await Shelter.findById(id);
    if (!shelter) {
      return res.status(404).json({
        success: false,
        error: 'Shelter not found'
      });
    }

    if (shelter.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Cannot reject an already verified shelter'
      });
    }

    shelter.isActive = false;
    shelter.rejectedAt = new Date();
    shelter.rejectedBy = req.user._id;
    shelter.rejectionReason = reason;
    await shelter.save();

    // Send rejection email
    if (shelter.email) {
      await sendEmail({
        email: shelter.email,
        subject: 'Shelter Application Status - FurShield',
        message: `We regret to inform you that your shelter application for "${shelter.name}" has been rejected. Reason: ${reason}. You may reapply after addressing the mentioned concerns.`
      });
    }

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'shelter_rejection',
      resource: 'shelter',
      resourceId: shelter._id.toString(),
      details: { shelterName: shelter.name, reason },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Shelter rejected successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Approve veterinarian
const approveVet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const vet = await User.findById(id);
    if (!vet) {
      return res.status(404).json({
        success: false,
        error: 'Veterinarian not found'
      });
    }

    if (vet.role !== 'vet') {
      return res.status(400).json({
        success: false,
        error: 'User is not a veterinarian'
      });
    }

    if (vet.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Veterinarian is already verified'
      });
    }

    vet.isVerified = true;
    vet.verifiedAt = new Date();
    vet.verifiedBy = req.user._id;
    if (notes) vet.approvalNotes = notes;
    await vet.save();

    // Send approval email
    await sendEmail({
      email: vet.email,
      subject: 'Veterinarian Application Approved - FurShield',
      message: `Congratulations Dr. ${vet.name}! Your veterinarian profile has been approved and verified on FurShield. You can now start accepting appointments and providing services to pet owners.`
    });

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'vet_approval',
      resource: 'user',
      resourceId: vet._id.toString(),
      details: { vetName: vet.name, notes },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Send notification to admins
    emitToAdmins('vet_approved', {
      vet: vet.name,
      approvedBy: req.user.name
    });

    res.json({
      success: true,
      message: 'Veterinarian approved successfully',
      data: {
        id: vet._id,
        name: vet.name,
        email: vet.email,
        isVerified: vet.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// Reject veterinarian
const rejectVet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const vet = await User.findById(id);
    if (!vet) {
      return res.status(404).json({
        success: false,
        error: 'Veterinarian not found'
      });
    }

    if (vet.role !== 'vet') {
      return res.status(400).json({
        success: false,
        error: 'User is not a veterinarian'
      });
    }

    if (vet.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Cannot reject an already verified veterinarian'
      });
    }

    vet.isActive = false;
    vet.rejectedAt = new Date();
    vet.rejectedBy = req.user._id;
    vet.rejectionReason = reason;
    await vet.save();

    // Send rejection email
    await sendEmail({
      email: vet.email,
      subject: 'Veterinarian Application Status - FurShield',
      message: `We regret to inform you that your veterinarian application has been rejected. Reason: ${reason}. You may reapply after addressing the mentioned concerns and updating your credentials.`
    });

    // Create audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'vet_rejection',
      resource: 'user',
      resourceId: vet._id.toString(),
      details: { vetName: vet.name, reason },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Veterinarian rejected successfully'
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
  manageUser,
  getUsers,
  getPayments,
  getPaymentStats,
  updatePaymentStatus,
  getAuditStats,
  updateUser,
  deleteUser,
  getPendingApprovals,
  approveShelter,
  rejectShelter,
  approveVet,
  rejectVet
};
