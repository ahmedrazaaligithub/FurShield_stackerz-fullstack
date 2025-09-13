const Appointment = require('../models/Appointment');
const Pet = require('../models/Pet');
const AuditLog = require('../models/AuditLog');

// Middleware to ensure vets can only access pets they have appointments with
const checkVetPetAccess = async (req, res, next) => {
  try {
    // Skip check for non-vet users (handled by other middleware)
    if (req.user.role !== 'vet') {
      return next();
    }

    // Ensure vet is verified
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

    // Check if pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }

    // Check if vet has valid appointment with this pet
    const hasAppointment = await Appointment.findOne({
      pet: petId,
      vet: req.user.id,
      status: { $in: ['pending', 'confirmed', 'in-progress', 'completed'] }
    });

    if (!hasAppointment) {
      // Log unauthorized access attempt
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

    // Add appointment info to request for use in controllers
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

// Middleware to get pets that vet has appointments with
const getVetAuthorizedPets = async (req, res, next) => {
  try {
    if (req.user.role !== 'vet') {
      return next();
    }

    // Get all pets this vet has appointments with
    const vetAppointments = await Appointment.find({
      vet: req.user.id,
      status: { $in: ['pending', 'confirmed', 'in-progress', 'completed'] }
    }).distinct('pet');

    // Add to request for use in controllers
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

// Middleware to validate vet can add health records (requires confirmed/completed appointment)
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

    // For health record creation, require confirmed/in-progress/completed appointment
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
