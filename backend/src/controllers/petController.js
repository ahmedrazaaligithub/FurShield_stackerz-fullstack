const Pet = require('../models/Pet');
const HealthRecord = require('../models/HealthRecord');
const AuditLog = require('../models/AuditLog');
const getUserPets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let filter = { isActive: true };
    if (req.user.role === 'owner' || req.user.role === 'shelter') {
      const requestedUserId = req.params.userId;
      if (requestedUserId) {
        if (requestedUserId !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: 'Not authorized to view other users\' pets'
          });
        }
        filter.owner = requestedUserId;
      } else {
        filter.owner = req.user.id;
      }
    } else if (req.user.role === 'vet') {
      if (req.vetAuthorizedPets && req.vetAuthorizedPets.length > 0) {
        filter._id = { $in: req.vetAuthorizedPets };
      } else {
        return res.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, pages: 0 }
        });
      }
    } else if (req.user.role === 'admin') {
    }
    const pets = await Pet.find(filter)
      .populate('owner', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await Pet.countDocuments(filter);
    res.json({
      success: true,
      data: pets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
const getPets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = { isActive: true };
    if (req.user.role === 'owner') {
      filter.owner = req.user.id;
    } else if (req.user.role === 'vet') {
      if (req.vetAuthorizedPets && req.vetAuthorizedPets.length > 0) {
        filter._id = { $in: req.vetAuthorizedPets };
      } else {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        });
      }
    }
    if (req.query.species) filter.species = req.query.species;
    if (req.query.owner && req.user.role === 'admin') filter.owner = req.query.owner;
    const pets = await Pet.find(filter)
      .populate('owner', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await Pet.countDocuments(filter);
    res.json({
      success: true,
      data: pets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
const getPet = async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('healthRecords')
      .populate('appointments');
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    if (req.user.role === 'owner' && pet.owner._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this pet'
      });
    }
    res.json({
      success: true,
      data: pet
    });
  } catch (error) {
    next(error);
  }
};
const createPet = async (req, res, next) => {
  try {
    const petData = {
      ...req.body,
      owner: req.user.id
    };
    const pet = await Pet.create(petData);
    await pet.populate('owner', 'name email');
    await AuditLog.create({
      user: req.user._id,
      action: 'pet_creation',
      resource: 'pet',
      resourceId: pet._id.toString(),
      details: petData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(201).json({
      success: true,
      data: pet
    });
  } catch (error) {
    next(error);
  }
};
const updatePet = async (req, res, next) => {
  try {
    let pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    if (req.user.role === 'owner' && pet.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this pet'
      });
    }
    pet = await Pet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email');
    await AuditLog.create({
      user: req.user._id,
      action: 'pet_update',
      resource: 'pet',
      resourceId: req.params.id,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: pet
    });
  } catch (error) {
    next(error);
  }
};
const deletePet = async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    if (req.user.role === 'owner' && pet.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this pet'
      });
    }
    pet.isActive = false;
    await pet.save();
    await AuditLog.create({
      user: req.user._id,
      action: 'pet_deletion',
      resource: 'pet',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
const uploadPetPhoto = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please upload at least one photo'
      });
    }
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    if (req.user.role === 'owner' && pet.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to upload photos for this pet'
      });
    }
    const photoUrls = req.files.map(file => `/uploads/pets/${file.filename}`);
    pet.photos.push(...photoUrls);
    await pet.save();
    res.json({
      success: true,
      data: pet
    });
  } catch (error) {
    next(error);
  }
};
const getHealthRecords = async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    const isOwner = pet.owner.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    let isAuthorizedVet = false;
    if (req.user.role === 'vet' && req.user.isVetVerified) {
      const Appointment = require('../models/Appointment');
      const hasAppointment = await Appointment.findOne({
        pet: req.params.id,
        vet: req.user.id,
        status: { $in: ['pending', 'confirmed', 'in-progress', 'completed'] }
      });
      isAuthorizedVet = !!hasAppointment;
      if (!isAuthorizedVet) {
        await AuditLog.create({
          user: req.user._id,
          action: 'unauthorized_health_records_access',
          resource: 'health_record',
          resourceId: req.params.id,
          details: { 
            reason: 'Vet attempted to access health records without appointment',
            petId: req.params.id
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
    }
    if (!isOwner && !isAdmin && !isAuthorizedVet) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access health records for pets you own or have appointments with.'
      });
    }
    const healthRecords = await HealthRecord.find({ pet: req.params.id })
      .populate('vet', 'name profile.specialization')
      .populate('appointment')
      .sort({ date: -1 });
    res.json({
      success: true,
      data: healthRecords
    });
  } catch (error) {
    next(error);
  }
};
const addHealthRecord = async (req, res, next) => {
  try {
    if (req.user.role !== 'vet' || !req.user.isVetVerified) {
      return res.status(403).json({
        success: false,
        error: 'Only verified veterinarians can add health records'
      });
    }
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    const Appointment = require('../models/Appointment');
    const hasAppointment = await Appointment.findOne({
      pet: req.params.id,
      vet: req.user.id,
      status: { $in: ['confirmed', 'in-progress', 'completed'] }
    });
    if (!hasAppointment) {
      await AuditLog.create({
        user: req.user._id,
        action: 'unauthorized_health_record_creation',
        resource: 'health_record',
        resourceId: req.params.id,
        details: { 
          reason: 'Vet attempted to add health record without appointment',
          petId: req.params.id
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only add health records for pets you have appointments with.'
      });
    }
    const healthRecord = await HealthRecord.create({
      ...req.body,
      pet: req.params.id,
      vet: req.user.id,
      appointment: hasAppointment._id
    });
    await healthRecord.populate('vet', 'name profile.specialization');
    await AuditLog.create({
      user: req.user._id,
      action: 'health_record_creation',
      resource: 'health_record',
      resourceId: healthRecord._id.toString(),
      details: { petId: req.params.id, appointmentId: hasAppointment._id },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(201).json({
      success: true,
      data: healthRecord
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
  uploadPetPhoto,
  getHealthRecords,
  addHealthRecord,
  getUserPets
};