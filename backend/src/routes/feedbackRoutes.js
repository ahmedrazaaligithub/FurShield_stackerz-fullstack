const express = require('express')
const feedbackController = require('../controllers/feedbackController')
const { protect, restrictTo } = require('../middlewares/auth')
const { validateRequest } = require('../middlewares/validation')
const { body, param } = require('express-validator')
const router = express.Router()
const validateFeedbackSubmission = [
  body('content')
    .notEmpty()
    .withMessage('Feedback content is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Feedback must be between 10 and 2000 characters'),
  body('type')
    .optional()
    .isIn(['professional_advice', 'care_tip', 'experience_share'])
    .withMessage('Invalid feedback type'),
  validateRequest
]
const validateFeedbackUpdate = [
  body('content')
    .notEmpty()
    .withMessage('Feedback content is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Feedback must be between 10 and 2000 characters'),
  validateRequest
]
const validatePetId = [
  param('petId').isMongoId().withMessage('Invalid pet ID'),
  validateRequest
]
const validateFeedbackId = [
  param('feedbackId').isMongoId().withMessage('Invalid feedback ID'),
  validateRequest
]
router.use(protect)
router.get('/pets/:petId/feedback', validatePetId, feedbackController.getPetFeedback)
router.post('/pets/:petId/feedback', validatePetId, validateFeedbackSubmission, feedbackController.submitFeedback)
router.patch('/feedback/:feedbackId', validateFeedbackId, validateFeedbackUpdate, feedbackController.updateFeedback)
router.delete('/feedback/:feedbackId', validateFeedbackId, feedbackController.deleteFeedback)
router.post('/feedback/:feedbackId/report', validateFeedbackId, feedbackController.reportFeedback)
router.get('/my-feedback', feedbackController.getUserFeedback)
module.exports = router