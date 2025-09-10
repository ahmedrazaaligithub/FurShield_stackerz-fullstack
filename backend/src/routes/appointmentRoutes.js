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

const router = express.Router();

router.use(protect);

router.get('/', getAppointments);
router.post('/', validate(appointmentSchema), createAppointment);
router.get('/:id', getAppointment);
router.put('/:id', updateAppointment);
router.put('/:id/accept', authorize('vet'), checkVetVerification, acceptAppointment);
router.put('/:id/propose-time', proposeTimeChange);
router.put('/:id/complete', authorize('vet'), checkVetVerification, completeAppointment);
router.put('/:id/cancel', cancelAppointment);

module.exports = router;
