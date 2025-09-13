const express = require('express');
const {
  getChatHistory,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  editMessage,
  getUnreadCount,
  getChatRooms
} = require('../controllers/chatController');
const { protect } = require('../middlewares/auth');
const router = express.Router();
router.use(protect);
router.get('/rooms', getChatRooms);
router.get('/unread-count', getUnreadCount);
router.get('/:chatRoom/history', getChatHistory);
router.post('/send', sendMessage);
router.put('/:chatRoom/read', markMessagesAsRead);
router.put('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);
module.exports = router;