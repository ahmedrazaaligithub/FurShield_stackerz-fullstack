const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markHelpful
} = require('../controllers/reviewController');
router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', authenticate, createReview);
router.post('/', authenticate, createReview);
router.put('/:reviewId', authenticate, updateReview);
router.delete('/:reviewId', authenticate, deleteReview);
router.post('/:reviewId/helpful', authenticate, markHelpful);
module.exports = router;