const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
} = require('../controllers/cartController');

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// Cart management routes
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId', removeFromCart);
router.delete('/clear', clearCart);

// Coupon routes
router.post('/coupon', applyCoupon);
router.delete('/coupon', removeCoupon);

module.exports = router;
