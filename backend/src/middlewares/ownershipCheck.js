const Pet = require('../models/Pet');
const Order = require('../models/Order');
const Appointment = require('../models/Appointment');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const checkPetOwnership = async (req, res, next) => {
  try {
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
    if (req.user.role === 'admin') {
      return next();
    }
    if (req.user.role === 'vet') {
      const hasAppointment = await Appointment.findOne({
        pet: petId,
        vet: req.user.id,
        status: { $in: ['pending', 'confirmed', 'in-progress', 'completed'] }
      });
      if (hasAppointment) {
        return next();
      }
      await AuditLog.create({
        user: req.user._id,
        action: 'unauthorized_vet_pet_access',
        resource: 'pet',
        resourceId: petId,
        details: { 
          reason: 'Vet attempted to access pet without appointment',
          vetId: req.user.id,
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
    if ((req.user.role === 'owner' || req.user.role === 'shelter') && pet.owner.toString() !== req.user.id) {
      await AuditLog.create({
        user: req.user._id,
        action: 'unauthorized_pet_access',
        resource: 'pet',
        resourceId: petId,
        details: { 
          actualOwner: pet.owner.toString(),
          attemptedBy: req.user.id,
          method: req.method,
          url: req.originalUrl
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own pets.'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while checking pet ownership'
    });
  }
};
const checkOrderOwnership = async (req, res, next) => {
  try {
    const orderId = req.params.id || req.params.orderId;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    if (req.user.role === 'admin') {
      return next();
    }
    if (order.user.toString() !== req.user.id) {
      await AuditLog.create({
        user: req.user._id,
        action: 'unauthorized_order_access',
        resource: 'order',
        resourceId: orderId,
        details: { 
          actualOwner: order.user.toString(),
          attemptedBy: req.user.id,
          method: req.method,
          url: req.originalUrl
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own orders.'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while checking order ownership'
    });
  }
};
const checkAppointmentOwnership = async (req, res, next) => {
  try {
    const appointmentId = req.params.id || req.params.appointmentId;
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        error: 'Appointment ID is required'
      });
    }
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    if (req.user.role === 'admin') {
      return next();
    }
    const isOwner = appointment.owner.toString() === req.user.id;
    const isVet = appointment.vet.toString() === req.user.id;
    if (!isOwner && !isVet) {
      await AuditLog.create({
        user: req.user._id,
        action: 'unauthorized_appointment_access',
        resource: 'appointment',
        resourceId: appointmentId,
        details: { 
          owner: appointment.owner.toString(),
          vet: appointment.vet.toString(),
          attemptedBy: req.user.id,
          method: req.method,
          url: req.originalUrl
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own appointments.'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while checking appointment ownership'
    });
  }
};
const checkDocumentOwnership = async (req, res, next) => {
  try {
    const documentId = req.params.id || req.params.documentId;
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required'
      });
    }
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    if (req.user.role === 'admin') {
      return next();
    }
    if (req.user.role === 'vet') {
      const hasAppointment = await Appointment.findOne({
        pet: document.pet,
        vet: req.user.id,
        status: { $in: ['pending', 'confirmed', 'in-progress', 'completed'] }
      });
      if (hasAppointment) {
        return next();
      }
    }
    if (document.owner.toString() !== req.user.id) {
      await AuditLog.create({
        user: req.user._id,
        action: 'unauthorized_document_access',
        resource: 'document',
        resourceId: documentId,
        details: { 
          actualOwner: document.owner.toString(),
          attemptedBy: req.user.id,
          method: req.method,
          url: req.originalUrl
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own documents.'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while checking document ownership'
    });
  }
};
const checkResourceOwnership = (resourceModel, ownerField = 'owner') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: 'Resource ID is required'
        });
      }
      const resource = await resourceModel.findById(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }
      if (req.user.role === 'admin') {
        return next();
      }
      if (resource[ownerField].toString() !== req.user.id) {
        await AuditLog.create({
          user: req.user._id,
          action: 'unauthorized_resource_access',
          resource: resourceModel.modelName.toLowerCase(),
          resourceId: resourceId,
          details: { 
            actualOwner: resource[ownerField].toString(),
            attemptedBy: req.user.id,
            method: req.method,
            url: req.originalUrl
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only access your own resources.'
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Server error while checking resource ownership'
      });
    }
  };
};
module.exports = {
  checkPetOwnership,
  checkOrderOwnership,
  checkAppointmentOwnership,
  checkDocumentOwnership,
  checkResourceOwnership
};