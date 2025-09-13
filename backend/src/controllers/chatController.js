const ChatMessage = require('../models/ChatMessage');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const getChatHistory = async (req, res, next) => {
  try {
    const { chatRoom } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const messages = await ChatMessage.find({ 
      chatRoom,
      isDeleted: false
    })
      .populate('sender', 'name avatar role')
      .populate('recipient', 'name avatar role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await ChatMessage.countDocuments({ 
      chatRoom,
      isDeleted: false
    });
    res.json({
      success: true,
      data: messages.reverse(),
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
const sendMessage = async (req, res, next) => {
  try {
    const { chatRoom, content, type, recipientId, appointmentId, petId } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }
      const isOwner = appointment.owner.toString() === req.user.id;
      const isVet = appointment.vet.toString() === req.user.id;
      if (!isOwner && !isVet) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to send messages in this chat'
        });
      }
      if (isVet && !appointment.vetAccepted) {
        return res.status(403).json({
          success: false,
          error: 'Veterinarian must accept the chat request first'
        });
      }
    }
    const message = await ChatMessage.create({
      sender: req.user.id,
      recipient: recipientId,
      content: content.trim(),
      type: type || 'text',
      chatRoom,
      appointment: appointmentId,
      pet: petId
    });
    await message.populate([
      { path: 'sender', select: 'name avatar role' },
      { path: 'recipient', select: 'name avatar role' }
    ]);
    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};
const markMessagesAsRead = async (req, res, next) => {
  try {
    const { chatRoom } = req.params;
    await ChatMessage.updateMany(
      { 
        chatRoom,
        recipient: req.user.id,
        isRead: false
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );
    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};
const deleteMessage = async (req, res, next) => {
  try {
    const message = await ChatMessage.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message'
      });
    }
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
const editMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const message = await ChatMessage.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this message'
      });
    }
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }
    message.originalContent = message.content;
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    await message.populate([
      { path: 'sender', select: 'name avatar role' },
      { path: 'recipient', select: 'name avatar role' }
    ]);
    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await ChatMessage.countDocuments({
      recipient: req.user.id,
      isRead: false,
      isDeleted: false
    });
    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};
const getChatRooms = async (req, res, next) => {
  try {
    const chatRooms = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { recipient: req.user._id }
          ],
          isDeleted: false
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$chatRoom',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', req.user._id] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.recipient',
          foreignField: '_id',
          as: 'recipient'
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);
    res.json({
      success: true,
      data: chatRooms
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getChatHistory,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  editMessage,
  getUnreadCount,
  getChatRooms
};