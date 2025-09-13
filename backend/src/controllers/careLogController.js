const Pet = require('../models/Pet');
const CareLog = require('../models/CareLog');
const AuditLog = require('../models/AuditLog');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
exports.getCareLogs = catchAsync(async (req, res, next) => {
  const { petId } = req.params;
  const { page = 1, limit = 10, type } = req.query;
  const query = { pet: petId };
  if (type) query.type = type;
  const careLogs = await CareLog.find(query)
    .populate('recordedBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  const total = await CareLog.countDocuments(query);
  res.status(200).json({
    success: true,
    data: {
      careLogs,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});
exports.getCareLogsByShelter = catchAsync(async (req, res, next) => {
  const { shelterId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const shelterPets = await Pet.find({ owner: shelterId }).select('_id');
  const petIds = shelterPets.map(pet => pet._id);
  const careLogs = await CareLog.find({ pet: { $in: petIds } })
    .populate('pet', 'name species breed')
    .populate('recordedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  const total = await CareLog.countDocuments({ pet: { $in: petIds } });
  res.status(200).json({
    success: true,
    data: {
      careLogs,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});
exports.addCareLog = catchAsync(async (req, res, next) => {
  const { petId } = req.params;
  const { type, description, details, nextDueDate } = req.body;
  const pet = await Pet.findById(petId);
  if (!pet) {
    return next(new AppError('Pet not found', 404));
  }
  if (req.user.role === 'shelter' && pet.owner.toString() !== req.user.id) {
    return next(new AppError('Not authorized to add care logs for this pet', 403));
  }
  const careLog = await CareLog.create({
    pet: petId,
    type,
    description,
    details,
    nextDueDate,
    recordedBy: req.user.id
  });
  await careLog.populate('recordedBy', 'name role');
  await AuditLog.create({
    user: req.user._id,
    action: 'care_log_added',
    resource: 'careLog',
    resourceId: careLog._id,
    details: { petId, type, description },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
  res.status(201).json({
    success: true,
    data: careLog
  });
});
exports.updateCareLog = catchAsync(async (req, res, next) => {
  const { logId } = req.params;
  const updates = req.body;
  const careLog = await CareLog.findById(logId);
  if (!careLog) {
    return next(new AppError('Care log not found', 404));
  }
  const pet = await Pet.findById(careLog.pet);
  if (req.user.role === 'shelter' && pet.owner.toString() !== req.user.id) {
    return next(new AppError('Not authorized to update this care log', 403));
  }
  Object.assign(careLog, updates);
  await careLog.save();
  await careLog.populate('recordedBy', 'name role');
  res.status(200).json({
    success: true,
    data: careLog
  });
});
exports.deleteCareLog = catchAsync(async (req, res, next) => {
  const { logId } = req.params;
  const careLog = await CareLog.findById(logId);
  if (!careLog) {
    return next(new AppError('Care log not found', 404));
  }
  const pet = await Pet.findById(careLog.pet);
  if (req.user.role === 'shelter' && pet.owner.toString() !== req.user.id) {
    return next(new AppError('Not authorized to delete this care log', 403));
  }
  await careLog.deleteOne();
  res.status(200).json({
    success: true,
    message: 'Care log deleted successfully'
  });
});