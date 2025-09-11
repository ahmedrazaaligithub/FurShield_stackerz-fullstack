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
  manageUser,
  getUsers,
  getPayments,
  getPaymentStats,
  updatePaymentStatus,
  getAuditStats,
  updateUser,
  deleteUser,
  getPendingApprovals,
  approveShelter,
  rejectShelter,
  approveVet,
  rejectVet
} = require('../controllers/adminController');
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

// Approval routes
router.get('/approvals', getPendingApprovals);
router.post('/shelters/:id/approve', approveShelter);
router.post('/shelters/:id/reject', rejectShelter);
router.post('/vets/:id/approve', approveVet);
router.post('/vets/:id/reject', rejectVet);

module.exports = router;
