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
router.get('/', authenticate, getFavorites);
router.get('/count', authenticate, getFavoritesCount);
router.get('/check/:productId', authenticate, checkFavoriteStatus);
router.post('/:productId', authenticate, addToFavorites);
router.delete('/:productId', authenticate, removeFromFavorites);
router.patch('/:productId/toggle', authenticate, toggleFavorite);
module.exports = router