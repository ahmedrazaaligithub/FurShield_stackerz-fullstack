const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { broadcastToAll } = require('../sockets/socketHandler');
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
module.exports = {
  getAuditLogs,
  getAuditStats,
  sendBroadcastNotification
};