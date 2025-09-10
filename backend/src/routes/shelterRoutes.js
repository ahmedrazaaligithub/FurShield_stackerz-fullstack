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

const router = express.Router();

router.get('/search', searchShelters);
router.get('/', getShelters);
router.post('/', protect, authorize('shelter'), createShelter);
router.get('/:id', getShelter);
router.put('/:id', protect, updateShelter);
router.delete('/:id', protect, deleteShelter);
router.post('/:id/verify', protect, authorize('admin'), verifyShelter);

module.exports = router;
