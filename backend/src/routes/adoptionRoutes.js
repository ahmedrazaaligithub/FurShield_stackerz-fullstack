const express = require('express');
const {
  getAdoptionListings,
  getAdoptionListing,
  createAdoptionListing,
  updateAdoptionListing,
  deleteAdoptionListing,
  submitInquiry,
  updateInquiryStatus,
  completeAdoption
} = require('../controllers/adoptionController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { adoptionListingSchema } = require('../utils/validation');
const router = express.Router();
router.get('/', getAdoptionListings);
router.get('/shelter/:userId', protect, authorize('shelter', 'admin'), require('../controllers/adoptionController').getShelterListingsByUser);
router.get('/:id', getAdoptionListing);
router.post('/', protect, authorize('shelter'), validate(adoptionListingSchema), createAdoptionListing);
router.put('/:id', protect, updateAdoptionListing);
router.delete('/:id', protect, deleteAdoptionListing);
router.post('/:id/inquiries', protect, authorize('owner'), submitInquiry);
router.put('/:id/inquiries', protect, authorize('shelter'), updateInquiryStatus);
router.put('/:id/complete', protect, authorize('shelter'), completeAdoption);
module.exports = router;