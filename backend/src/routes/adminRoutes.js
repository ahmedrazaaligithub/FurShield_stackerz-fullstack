const express = require('express');
const { getDashboardStats, getSystemHealth } = require('../controllers/dashboardController');
const { getUsers, manageUser, updateUser, deleteUser } = require('../controllers/userManagementController');
const { 
  getPaymentProviders, 
  addPaymentProvider, 
  updatePaymentProvider, 
  removePaymentProvider,
  getPayments,
  getPaymentStats,
  updatePaymentStatus
} = require('../controllers/paymentManagementController');
const { getAuditLogs, getAuditStats, sendBroadcastNotification } = require('../controllers/auditController');
const { 
  getPendingApprovals, 
  approveShelter, 
  rejectShelter, 
  approveVet, 
  rejectVet 
} = require('../controllers/approvalController');
const { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  getCategoryStats 
} = require('../controllers/categoryController');
const { 
  getAllProductsAdmin, 
  getProductStats, 
  createProductAdmin, 
  updateProductAdmin, 
  deleteProductAdmin 
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { paymentProviderSchema } = require('../utils/validation');
const router = express.Router();
router.use(protect);
router.use(authorize('admin'));
router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:userId', manageUser);
router.get('/payments', getPayments);
router.get('/payment-stats', getPaymentStats);
router.put('/payments/:id/status', updatePaymentStatus);
router.get('/payment-providers', getPaymentProviders);
router.post('/payment-providers', validate(paymentProviderSchema), addPaymentProvider);
router.put('/payment-providers/:id', updatePaymentProvider);
router.delete('/payment-providers/:id', removePaymentProvider);
router.get('/audit-logs', getAuditLogs);
router.get('/audit-stats', getAuditStats);
router.post('/broadcast', sendBroadcastNotification);
router.get('/system-health', getSystemHealth);
router.delete('/users/:userId', (req, res, next) => {
  req.body = { action: 'deactivate', reason: 'Admin deletion' };
  manageUser(req, res, next);
});
router.get('/approvals', getPendingApprovals);
router.post('/shelters/:id/approve', approveShelter);
router.post('/shelters/:id/reject', rejectShelter);
router.post('/vets/:id/approve', approveVet);
router.post('/vets/:id/reject', rejectVet);
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/category-stats', getCategoryStats);
router.get('/products', getAllProductsAdmin);
router.post('/products', createProductAdmin);
router.put('/products/:id', updateProductAdmin);
router.delete('/products/:id', deleteProductAdmin);
router.get('/product-stats', getProductStats);
module.exports = router;