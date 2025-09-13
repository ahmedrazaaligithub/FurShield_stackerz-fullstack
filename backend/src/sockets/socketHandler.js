const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const Notification = require('../models/Notification');
const { logger } = require('../utils/logger');
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      socket.userId = null;
      socket.userRole = null;
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        socket.userId = null;
        socket.userRole = null;
        return next();
      }
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (jwtError) {
      socket.userId = null;
      socket.userRole = null;
      next();
    }
  } catch (error) {
    socket.userId = null;
    socket.userRole = null;
    next();
  }
};
const initializeSocket = (io) => {
  io.use(authenticateSocket);
  io.on('connection', (socket) => {
    if (socket.userId) {
      logger.info(`User ${socket.userId} connected`);
      socket.join(`user_${socket.userId}`);
    } else {
      logger.info('Anonymous user connected');
    }
    socket.on('join_chat', async (data) => {
      try {
        const { chatRoom, appointmentId } = data;
        if (appointmentId) {
          const Appointment = require('../models/Appointment');
          const appointment = await Appointment.findById(appointmentId)
            .populate('owner')
            .populate('vet');
          if (!appointment) {
            socket.emit('error', { message: 'Appointment not found' });
            return;
          }
          const isOwner = appointment.owner._id.toString() === socket.userId;
          const isVet = appointment.vet._id.toString() === socket.userId;
          if (!isOwner && !isVet) {
            socket.emit('error', { message: 'Not authorized to join this chat' });
            return;
          }
          if (isVet && !appointment.vetAccepted) {
            appointment.vetAccepted = true;
            appointment.vetAcceptedAt = new Date();
            await appointment.save();
            socket.to(`user_${appointment.owner._id}`).emit('vet_accepted_chat', {
              appointmentId,
              vetName: appointment.vet.name
            });
          }
        }
        socket.join(chatRoom);
        socket.currentChatRoom = chatRoom;
        const messages = await ChatMessage.find({ chatRoom })
          .populate('sender', 'name avatar')
          .sort({ createdAt: -1 })
          .limit(50);
        socket.emit('chat_history', messages.reverse());
      } catch (error) {
        logger.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });
    socket.on('send_message', async (data) => {
      try {
        const { chatRoom, content, type, recipientId, appointmentId, petId } = data;
        if (socket.currentChatRoom !== chatRoom) {
          socket.emit('error', { message: 'Not authorized to send message to this chat' });
          return;
        }
        const message = await ChatMessage.create({
          sender: socket.userId,
          recipient: recipientId,
          content,
          type: type || 'text',
          chatRoom,
          appointment: appointmentId,
          pet: petId
        });
        await message.populate('sender', 'name avatar');
        io.to(chatRoom).emit('new_message', message);
        const notification = await Notification.create({
          recipient: recipientId,
          sender: socket.userId,
          title: 'New Message',
          message: `You have a new message: ${content.substring(0, 50)}...`,
          type: 'chat',
          data: { chatRoom, messageId: message._id }
        });
        io.to(`user_${recipientId}`).emit('new_notification', notification);
      } catch (error) {
        logger.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    socket.on('mark_messages_read', async (data) => {
      try {
        const { chatRoom } = data;
        await ChatMessage.updateMany(
          { chatRoom, recipient: socket.userId, isRead: false },
          { isRead: true, readAt: new Date() }
        );
        socket.to(chatRoom).emit('messages_read', { userId: socket.userId });
      } catch (error) {
        logger.error('Mark messages read error:', error);
      }
    });
    socket.on('typing_start', (data) => {
      const { chatRoom } = data;
      socket.to(chatRoom).emit('user_typing', { userId: socket.userId });
    });
    socket.on('typing_stop', (data) => {
      const { chatRoom } = data;
      socket.to(chatRoom).emit('user_stopped_typing', { userId: socket.userId });
    });
    socket.on('request_chat', async (data) => {
      try {
        const { vetId, appointmentId, message } = data;
        const notification = await Notification.create({
          recipient: vetId,
          sender: socket.userId,
          title: 'Chat Request',
          message: message || 'A user is requesting to chat with you',
          type: 'chat',
          data: { appointmentId, requesterId: socket.userId }
        });
        io.to(`user_${vetId}`).emit('chat_request', {
          notification,
          appointmentId,
          requesterId: socket.userId
        });
      } catch (error) {
        logger.error('Request chat error:', error);
        socket.emit('error', { message: 'Failed to send chat request' });
      }
    });
    socket.on('accept_chat_request', async (data) => {
      try {
        const { appointmentId, requesterId } = data;
        const chatRoom = `appointment_${appointmentId}`;
        socket.join(chatRoom);
        const notification = await Notification.create({
          recipient: requesterId,
          sender: socket.userId,
          title: 'Chat Request Accepted',
          message: 'Your chat request has been accepted',
          type: 'chat',
          data: { chatRoom, appointmentId }
        });
        io.to(`user_${requesterId}`).emit('chat_request_accepted', {
          notification,
          chatRoom,
          appointmentId,
          vetId: socket.userId
        });
      } catch (error) {
        logger.error('Accept chat request error:', error);
        socket.emit('error', { message: 'Failed to accept chat request' });
      }
    });
    socket.on('admin_broadcast', async (data) => {
      try {
        if (socket.userRole !== 'admin') {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }
        const { title, message, priority } = data;
        const users = await User.find({ isActive: true });
        for (const user of users) {
          await Notification.create({
            recipient: user._id,
            sender: socket.userId,
            title,
            message,
            type: 'system',
            priority: priority || 'medium'
          });
        }
        io.emit('admin_broadcast', { title, message, priority });
      } catch (error) {
        logger.error('Admin broadcast error:', error);
        socket.emit('error', { message: 'Failed to send broadcast' });
      }
    });
    socket.on('payment_completed', async (data) => {
      try {
        const { orderId, amount, adminNotify } = data;
        if (adminNotify) {
          const admins = await User.find({ role: 'admin', isActive: true });
          for (const admin of admins) {
            const notification = await Notification.create({
              recipient: admin._id,
              sender: socket.userId,
              title: 'Payment Received',
              message: `Payment of $${amount} received for order ${orderId}`,
              type: 'payment',
              priority: 'high',
              data: { orderId, amount }
            });
            io.to(`user_${admin._id}`).emit('payment_notification', notification);
          }
        }
      } catch (error) {
        logger.error('Payment notification error:', error);
      }
    });
    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected`);
    });
  });
  return io;
};
const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};
const emitToAdmins = async (io, event, data) => {
  const admins = await User.find({ role: 'admin', isActive: true });
  admins.forEach(admin => {
    io.to(`user_${admin._id}`).emit(event, data);
  });
};
const broadcastToAll = (io, event, data) => {
  io.emit(event, data);
};
module.exports = {
  initializeSocket,
  emitToUser,
  emitToAdmins,
  broadcastToAll
};