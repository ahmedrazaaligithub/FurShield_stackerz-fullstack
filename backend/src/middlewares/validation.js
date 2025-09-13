const { validationResult } = require('express-validator')
const mongoose = require('mongoose')
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  };
};
const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    })
  }
  next()
}
const validateObjectId = (req, res, next) => {
  const { petId, feedbackId, userId } = req.params
  if (petId && !mongoose.Types.ObjectId.isValid(petId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid pet ID format'
    })
  }
  if (feedbackId && !mongoose.Types.ObjectId.isValid(feedbackId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid feedback ID format'
    })
  }
  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid user ID format'
    })
  }
  next()
}
module.exports = { 
  validate, 
  validateRequest, 
  validateObjectId 
};