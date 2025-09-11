const express = require('express')
const feedbackController = require('../controllers/feedbackController')
const { protect, restrictTo } = require('../middlewares/auth')
const { validateRequest } = require('../middlewares/validation')
const { body, param } = require('express-validator')

const router = express.Router()

// Validation middleware
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

const validateObjectId = [
  param('petId').isMongoId().withMessage('Invalid pet ID'),
  param('feedbackId').isMongoId().withMessage('Invalid feedback ID'),
  validateRequest
]

// Protect all routes
router.use(protect)

// Pet feedback routes
router.get('/pets/:petId/feedback', validateObjectId, feedbackController.getPetFeedback)
router.post('/pets/:petId/feedback', validateObjectId, validateFeedbackSubmission, feedbackController.submitFeedback)

// Individual feedback routes
router.patch('/feedback/:feedbackId', validateObjectId, validateFeedbackUpdate, feedbackController.updateFeedback)
router.delete('/feedback/:feedbackId', validateObjectId, feedbackController.deleteFeedback)
router.post('/feedback/:feedbackId/report', validateObjectId, feedbackController.reportFeedback)

// User feedback routes
router.get('/my-feedback', feedbackController.getUserFeedback)

module.exports = router
