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
router.use(protect);
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId', removeFromCart);
router.delete('/clear', clearCart);
router.post('/coupon', applyCoupon);
router.delete('/coupon', removeCoupon);
module.exports = router;