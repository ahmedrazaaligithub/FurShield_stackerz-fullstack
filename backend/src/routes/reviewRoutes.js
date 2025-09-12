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

// Get reviews for a product (public)
router.get('/product/:productId', getProductReviews);

// Create a review (authenticated users only)
router.post('/product/:productId', authenticate, createReview);

// Create a review (alternative route)
router.post('/', authenticate, createReview);

// Update a review (review owner only)
router.put('/:reviewId', authenticate, updateReview);

// Delete a review (review owner or admin)
router.delete('/:reviewId', authenticate, deleteReview);

// Mark review as helpful (authenticated users)
router.post('/:reviewId/helpful', authenticate, markHelpful);

module.exports = router;
