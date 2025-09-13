const express = require('express');
const {
  getRatings,
  getRating,
  createRating,
  updateRating,
  deleteRating,
  markHelpful,
  reportRating,
  moderateRating
} = require('../controllers/ratingController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { ratingSchema } = require('../utils/validation');
const router = express.Router();
router.get('/', getRatings);
router.get('/:id', getRating);
router.post('/', protect, validate(ratingSchema), createRating);
router.put('/:id', protect, updateRating);
router.delete('/:id', protect, deleteRating);
router.post('/:id/helpful', protect, markHelpful);
router.post('/:id/report', protect, reportRating);
router.post('/:id/moderate', protect, authorize('admin'), moderateRating);
module.exports = router;