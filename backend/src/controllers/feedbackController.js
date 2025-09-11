const Feedback = require('../models/Feedback')
const Pet = require('../models/Pet')
const { catchAsync } = require('../utils/catchAsync')
const AppError = require('../utils/appError')

// Get all feedback for a pet
exports.getPetFeedback = catchAsync(async (req, res, next) => {
  const { petId } = req.params
  
  // Check if pet exists
  const pet = await Pet.findById(petId)
  if (!pet) {
    return next(new AppError('Pet not found', 404))
  }

  const feedback = await Feedback.find({ 
    pet: petId, 
    isActive: true 
  }).sort({ createdAt: -1 })

  res.status(200).json({
    status: 'success',
    results: feedback.length,
    data: feedback
  })
})

// Submit feedback for a pet
exports.submitFeedback = catchAsync(async (req, res, next) => {
  const { petId } = req.params
  const { content, type } = req.body
  const userId = req.user.id

  // Check if pet exists
  const pet = await Pet.findById(petId)
  if (!pet) {
    return next(new AppError('Pet not found', 404))
  }

  // Validate feedback type based on user role
  const userRole = req.user.role
  let feedbackType = type

  if (!feedbackType) {
    // Auto-assign type based on user role
    if (userRole === 'veterinarian' || userRole === 'vet') {
      feedbackType = 'professional_advice'
    } else if (userRole === 'shelter') {
      feedbackType = 'care_tip'
    } else {
      feedbackType = 'experience_share'
    }
  }

  const feedback = await Feedback.create({
    pet: petId,
    user: userId,
    content,
    type: feedbackType
  })

  // Populate user details
  await feedback.populate('user', 'name role avatar')

  res.status(201).json({
    status: 'success',
    data: feedback
  })
})

// Update feedback
exports.updateFeedback = catchAsync(async (req, res, next) => {
  const { feedbackId } = req.params
  const { content } = req.body
  const userId = req.user.id

  const feedback = await Feedback.findById(feedbackId)
  
  if (!feedback) {
    return next(new AppError('Feedback not found', 404))
  }

  // Check if user owns this feedback
  if (feedback.user._id.toString() !== userId) {
    return next(new AppError('You can only edit your own feedback', 403))
  }

  feedback.content = content
  await feedback.save()

  res.status(200).json({
    status: 'success',
    data: feedback
  })
})

// Delete feedback
exports.deleteFeedback = catchAsync(async (req, res, next) => {
  const { feedbackId } = req.params
  const userId = req.user.id

  const feedback = await Feedback.findById(feedbackId)
  
  if (!feedback) {
    return next(new AppError('Feedback not found', 404))
  }

  // Check if user owns this feedback or is admin
  if (feedback.user._id.toString() !== userId && req.user.role !== 'admin') {
    return next(new AppError('You can only delete your own feedback', 403))
  }

  // Soft delete
  feedback.isActive = false
  await feedback.save()

  res.status(204).json({
    status: 'success',
    data: null
  })
})

// Report feedback
exports.reportFeedback = catchAsync(async (req, res, next) => {
  const { feedbackId } = req.params
  const userId = req.user.id

  const feedback = await Feedback.findById(feedbackId)
  
  if (!feedback) {
    return next(new AppError('Feedback not found', 404))
  }

  // Check if user already reported this feedback
  if (feedback.reportedBy.includes(userId)) {
    return next(new AppError('You have already reported this feedback', 400))
  }

  feedback.reportedBy.push(userId)
  feedback.reportCount += 1
  await feedback.save()

  res.status(200).json({
    status: 'success',
    message: 'Feedback reported successfully'
  })
})

// Get user's feedback
exports.getUserFeedback = catchAsync(async (req, res, next) => {
  const userId = req.user.id
  
  const feedback = await Feedback.find({ 
    user: userId, 
    isActive: true 
  }).populate('pet', 'name species breed').sort({ createdAt: -1 })

  res.status(200).json({
    status: 'success',
    results: feedback.length,
    data: feedback
  })
})
