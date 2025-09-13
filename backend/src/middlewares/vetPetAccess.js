const Appointment = require('../models/Appointment');
const Pet = require('../models/Pet');
const AuditLog = require('../models/AuditLog');
const checkVetPetAccess = async (req, res, next) => {
  try {
    if (req.user.role !== 'vet') {
      return next();
    }
    if (!req.user.isVetVerified) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Veterinarian verification required.'
      });
    }
    const petId = req.params.id || req.params.petId || req.body.petId;
    if (!petId) {
      return res.status(400).json({
        success: false,
        error: 'Pet ID is required'
      });
    }
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    const hasAppointment = await Appointment.findOne({
      pet: petId,
      vet: req.user.id,
      status: { $in: ['pending', 'confirmed', 'in-progress', 'completed'] }
    });
    if (!hasAppointment) {
      await AuditLog.create({
        user: req.user._id,
        action: 'unauthorized_vet_pet_access',
        resource: 'pet',
        resourceId: petId,
        details: { 
          reason: 'Vet attempted to access pet without valid appointment',
          vetId: req.user.id,
          petId: petId,
          method: req.method,
          url: req.originalUrl
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access pets you have appointments with.'
      });
    }
    req.vetAppointment = hasAppointment;
    req.pet = pet;
    next();
  } catch (error) {
    console.error('Vet pet access middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during access validation'
    });
  }
};
const getVetAuthorizedPets = async (req, res, next) => {
  try {
    if (req.user.role !== 'vet') {
      return next();
    }
    const vetAppointments = await Appointment.find({
      vet: req.user.id,
      status: { $in: ['pending', 'confirmed', 'in-progress', 'completed'] }
    }).distinct('pet');
    req.vetAuthorizedPets = vetAppointments;
    next();
  } catch (error) {
    console.error('Get vet authorized pets middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during pet authorization check'
    });
  }
};
const checkVetHealthRecordAccess = async (req, res, next) => {
  try {
    if (req.user.role !== 'vet') {
      return next();
    }
    if (!req.user.isVetVerified) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Veterinarian verification required.'
      });
    }
    const petId = req.params.id || req.params.petId || req.body.petId;
    if (!petId) {
      return res.status(400).json({
        success: false,
        error: 'Pet ID is required'
      });
    }
    const hasValidAppointment = await Appointment.findOne({
      pet: petId,
      vet: req.user.id,
      status: { $in: ['confirmed', 'in-progress', 'completed'] }
    });
    if (!hasValidAppointment) {
      await AuditLog.create({
        user: req.user._id,
        action: 'unauthorized_health_record_access',
        resource: 'health_record',
        resourceId: petId,
        details: { 
          reason: 'Vet attempted to access/modify health records without confirmed appointment',
          vetId: req.user.id,
          petId: petId,
          method: req.method,
          url: req.originalUrl
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. You need a confirmed appointment to access/modify health records.'
      });
    }
    req.vetAppointment = hasValidAppointment;
    next();
  } catch (error) {
    console.error('Vet health record access middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during health record access validation'
    });
  }
};
module.exports = {
  checkVetPetAccess,
  getVetAuthorizedPets,
  checkVetHealthRecordAccess
};