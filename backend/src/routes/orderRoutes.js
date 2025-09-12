const express = require('express');
const {
  getOrders,
  getOrder,
  createOrder,
  processPayment,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getOrders);
router.post('/', createOrder);
router.get('/:id', getOrder);
router.put('/:id', authorize('admin'), updateOrderStatus);
router.post('/:id/payment', processPayment);
router.put('/:id/status', authorize('admin'), updateOrderStatus);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
