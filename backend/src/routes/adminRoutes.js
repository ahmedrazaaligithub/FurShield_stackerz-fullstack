const express = require('express');
const {
  getDashboardStats,
  getPaymentProviders,
  addPaymentProvider,
  updatePaymentProvider,
  removePaymentProvider,
  getAuditLogs,
  sendBroadcastNotification,
  getSystemHealth,
  manageUser
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { paymentProviderSchema } = require('../utils/validation');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/payment-providers', getPaymentProviders);
router.post('/payment-providers', validate(paymentProviderSchema), addPaymentProvider);
router.put('/payment-providers/:id', updatePaymentProvider);
router.delete('/payment-providers/:id', removePaymentProvider);
router.get('/audit-logs', getAuditLogs);
router.post('/broadcast', sendBroadcastNotification);
router.get('/system-health', getSystemHealth);
router.put('/users/:userId', manageUser);

module.exports = router;
