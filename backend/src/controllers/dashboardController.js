const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AdoptionListing = require('../models/AdoptionListing');
const Shelter = require('../models/Shelter');
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
const getSystemHealth = async (req, res, next) => {
  try {
    const dbStatus = 'connected';
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const activeConnections = global.io ? global.io.engine.clientsCount : 0;
    const AuditLog = require('../models/AuditLog');
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
module.exports = {
  getDashboardStats,
  getSystemHealth
};