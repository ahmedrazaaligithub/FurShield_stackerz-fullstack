const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  checkFavoriteStatus,
  getFavoritesCount
} = require('../controllers/favoriteController');

// Get user's favorite products
router.get('/', authenticate, getFavorites);

// Get favorites count
router.get('/count', authenticate, getFavoritesCount);

// Check if product is favorited
router.get('/check/:productId', authenticate, checkFavoriteStatus);

// Add product to favorites
router.post('/:productId', authenticate, addToFavorites);

// Remove product from favorites
router.delete('/:productId', authenticate, removeFromFavorites);

// Toggle favorite status
router.patch('/:productId/toggle', authenticate, toggleFavorite);

module.exports = router
