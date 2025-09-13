const PaymentProvider = require('../models/PaymentProvider');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const paymentService = require('../services/paymentService');
const { broadcastToAll } = require('../sockets/socketHandler');
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
module.exports = {
  getPaymentProviders,
  addPaymentProvider,
  updatePaymentProvider,
  removePaymentProvider,
  getPayments,
  getPaymentStats,
  updatePaymentStatus
};