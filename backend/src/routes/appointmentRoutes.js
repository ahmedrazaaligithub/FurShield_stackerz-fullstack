const express = require('express');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  acceptAppointment,
  proposeTimeChange,
  completeAppointment,
  cancelAppointment
} = require('../controllers/appointmentController');
const { protect, authorize, checkVetVerification } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { appointmentSchema } = require('../utils/validation');
const { checkAppointmentOwnership } = require('../middlewares/ownershipCheck');
const router = express.Router();
router.use(protect);
router.get('/', getAppointments);
router.post('/', validate(appointmentSchema), createAppointment);
router.get('/:id', checkAppointmentOwnership, getAppointment);
router.put('/:id', checkAppointmentOwnership, updateAppointment);
router.put('/:id/accept', authorize('vet'), checkVetVerification, checkAppointmentOwnership, acceptAppointment);
router.put('/:id/propose-time', checkAppointmentOwnership, proposeTimeChange);
router.put('/:id/complete', authorize('vet'), checkVetVerification, checkAppointmentOwnership, completeAppointment);
router.put('/:id/cancel', checkAppointmentOwnership, cancelAppointment);
module.exports = router;