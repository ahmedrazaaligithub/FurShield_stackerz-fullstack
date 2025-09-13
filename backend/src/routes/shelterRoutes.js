const express = require('express');
const {
  getShelters,
  getShelter,
  createShelter,
  updateShelter,
  deleteShelter,
  verifyShelter,
  searchShelters
} = require('../controllers/shelterController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { shelterCreateSchema, shelterUpdateSchema } = require('../utils/validation');
const router = express.Router();
router.get('/search', searchShelters);
router.get('/', getShelters);
router.get('/me', protect, authorize('shelter', 'admin'), require('../controllers/shelterController').getMyShelter);
router.post('/', protect, authorize('shelter'), validate(shelterCreateSchema), createShelter);
router.get('/:id', getShelter);
router.put('/:id', protect, validate(shelterUpdateSchema), updateShelter);
router.delete('/:id', protect, deleteShelter);
router.post('/:id/verify', protect, authorize('admin'), verifyShelter);
module.exports = router;