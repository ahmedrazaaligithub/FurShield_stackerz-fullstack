const Feedback = require('../models/Feedback')
const Pet = require('../models/Pet')
const { catchAsync } = require('../utils/catchAsync')
const AppError = require('../utils/appError')
exports.getPetFeedback = catchAsync(async (req, res, next) => {
  const { petId } = req.params
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
exports.submitFeedback = catchAsync(async (req, res, next) => {
  const { petId } = req.params
  const { content, type } = req.body
  const userId = req.user.id
  if (!content || content.trim().length === 0) {
    return next(new AppError('Feedback content is required', 400))
  }
  const pet = await Pet.findById(petId)
  if (!pet) {
    return next(new AppError('Pet not found', 404))
  }
  const userRole = req.user.role
  let feedbackType = type
  if (!feedbackType) {
    if (userRole === 'veterinarian' || userRole === 'vet') {
      feedbackType = 'professional_advice'
    } else if (userRole === 'shelter') {
      feedbackType = 'care_tip'
    } else {
      feedbackType = 'experience_share'
    }
  }
  const validTypes = ['professional_advice', 'care_tip', 'experience_share']
  if (!validTypes.includes(feedbackType)) {
    return next(new AppError('Invalid feedback type', 400))
  }
  const feedback = await Feedback.create({
    pet: petId,
    user: userId,
    content,
    type: feedbackType
  })
  await feedback.populate('user', 'name role avatar')
  res.status(201).json({
    status: 'success',
    data: feedback
  })
})
exports.updateFeedback = catchAsync(async (req, res, next) => {
  const { feedbackId } = req.params
  const { content } = req.body
  const userId = req.user.id
  const feedback = await Feedback.findById(feedbackId)
  if (!feedback) {
    return next(new AppError('Feedback not found', 404))
  }
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
exports.deleteFeedback = catchAsync(async (req, res, next) => {
  const { feedbackId } = req.params
  const userId = req.user.id
  const feedback = await Feedback.findById(feedbackId)
  if (!feedback) {
    return next(new AppError('Feedback not found', 404))
  }
  if (feedback.user._id.toString() !== userId && req.user.role !== 'admin') {
    return next(new AppError('You can only delete your own feedback', 403))
  }
  feedback.isActive = false
  await feedback.save()
  res.status(204).json({
    status: 'success',
    data: null
  })
})
exports.reportFeedback = catchAsync(async (req, res, next) => {
  const { feedbackId } = req.params
  const userId = req.user.id
  const feedback = await Feedback.findById(feedbackId)
  if (!feedback) {
    return next(new AppError('Feedback not found', 404))
  }
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