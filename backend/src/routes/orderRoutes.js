const express = require('express');
const {
  getOrders,
  getOrder,
  createOrder,
  processPayment,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/auth');
const { checkOrderOwnership } = require('../middlewares/ownershipCheck');
const router = express.Router();
router.use(protect);
router.get('/', getOrders);
router.post('/', createOrder);
router.get('/:id', checkOrderOwnership, getOrder);
router.put('/:id', authorize('admin'), updateOrderStatus);
router.post('/:id/payment', checkOrderOwnership, processPayment);
router.put('/:id/status', authorize('admin'), updateOrderStatus);
router.put('/:id/cancel', checkOrderOwnership, cancelOrder);
module.exports = router;