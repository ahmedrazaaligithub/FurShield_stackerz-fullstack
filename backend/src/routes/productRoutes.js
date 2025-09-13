const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  updateInventory
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/auth');
const router = express.Router();
router.get('/categories', getCategories);
router.get('/', getProducts);
router.post('/', protect, authorize('admin'), createProduct);
router.get('/:id', getProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.put('/:id/inventory', protect, updateInventory);
module.exports = router;