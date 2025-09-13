const Appointment = require('../models/Appointment');
const Pet = require('../models/Pet');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { sendAppointmentReminder } = require('../services/emailService');
const { emitToUser } = require('../sockets/socketHandler');
const getAppointments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.user.role === 'owner') {
      filter.owner = req.user.id;
    } else if (req.user.role === 'vet') {
      filter.vet = req.user.id;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.petId) filter.pet = req.query.petId;
    if (req.query.date) {
      const date = new Date(req.query.date);
      filter.appointmentDate = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      };
    }
    const appointments = await Appointment.find(filter)
      .populate('pet', 'name species breed')
      .populate('owner', 'name email phone')
      .populate('vet', 'name profile.specialization')
      .skip(skip)
      .limit(limit)
      .sort({ appointmentDate: 1 });
    const total = await Appointment.countDocuments(filter);
    res.json({
      success: true,
      data: appointments,
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
const getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('pet')
      .populate('owner', 'name email phone')
      .populate('vet', 'name profile.specialization')
      .populate('healthRecord');
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    const isOwner = appointment.owner._id.toString() === req.user.id;
    const isVet = appointment.vet._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isVet && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this appointment'
      });
    }
    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};
const createAppointment = async (req, res, next) => {
  try {
    const { petId, vetId, appointmentDate, reason, notes, type } = req.body;
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    if (pet.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to book appointment for this pet'
      });
    }
    const vet = await User.findById(vetId);
    if (!vet || vet.role !== 'vet') {
      return res.status(404).json({
        success: false,
        error: 'Veterinarian not found'
      });
    }
    const existingAppointment = await Appointment.findOne({
      vet: vetId,
      appointmentDate: {
        $gte: new Date(appointmentDate),
        $lt: new Date(new Date(appointmentDate).getTime() + 60 * 60 * 1000)
      },
      status: { $in: ['pending', 'confirmed', 'in-progress'] }
    });
    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        error: 'Veterinarian is not available at this time'
      });
    }
    const appointment = await Appointment.create({
      pet: petId,
      owner: req.user.id,
      vet: vetId,
      appointmentDate,
      reason,
      notes,
      type: type || 'consultation'
    });
    await appointment.populate([
      { path: 'pet', select: 'name species breed' },
      { path: 'owner', select: 'name email phone' },
      { path: 'vet', select: 'name profile.specialization' }
    ]);
    const notification = await Notification.create({
      recipient: vetId,
      sender: req.user.id,
      title: 'New Appointment Request',
      message: `New appointment request for ${pet.name} on ${new Date(appointmentDate).toLocaleDateString()}`,
      type: 'appointment',
      data: { appointmentId: appointment._id }
    });
    if (global.io) {
      emitToUser(global.io, vetId, 'new_notification', notification);
    }
    await AuditLog.create({
      user: req.user._id,
      action: 'appointment_creation',
      resource: 'appointment',
      resourceId: appointment._id.toString(),
      details: { petId, vetId, appointmentDate },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};
const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    const isOwner = appointment.owner.toString() === req.user.id;
    const isVet = appointment.vet.toString() === req.user.id;
    if (!isOwner && !isVet && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this appointment'
      });
    }
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'pet', select: 'name species breed' },
      { path: 'owner', select: 'name email phone' },
      { path: 'vet', select: 'name profile.specialization' }
    ]);
    await AuditLog.create({
      user: req.user._id,
      action: 'appointment_update',
      resource: 'appointment',
      resourceId: req.params.id,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: updatedAppointment
    });
  } catch (error) {
    next(error);
  }
};
const acceptAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    if (appointment.vet.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to accept this appointment'
      });
    }
    appointment.status = 'confirmed';
    appointment.vetAccepted = true;
    appointment.vetAcceptedAt = new Date();
    await appointment.save();
    await appointment.populate([
      { path: 'pet', select: 'name species breed' },
      { path: 'owner', select: 'name email phone' },
      { path: 'vet', select: 'name profile.specialization' }
    ]);
    const notification = await Notification.create({
      recipient: appointment.owner,
      sender: req.user.id,
      title: 'Appointment Confirmed',
      message: `Your appointment for ${appointment.pet.name} has been confirmed`,
      type: 'appointment',
      data: { appointmentId: appointment._id }
    });
    if (global.io) {
      emitToUser(global.io, appointment.owner, 'appointment_confirmed', {
        appointment,
        notification
      });
    }
    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};
const proposeTimeChange = async (req, res, next) => {
  try {
    const { proposedDate, reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    const isOwner = appointment.owner.toString() === req.user.id;
    const isVet = appointment.vet.toString() === req.user.id;
    if (!isOwner && !isVet) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to propose time change'
      });
    }
    appointment.proposedTimeChanges.push({
      proposedDate,
      reason,
      proposedBy: req.user.id
    });
    await appointment.save();
    await appointment.populate([
      { path: 'pet', select: 'name species breed' },
      { path: 'owner', select: 'name email phone' },
      { path: 'vet', select: 'name profile.specialization' }
    ]);
    const recipientId = isOwner ? appointment.vet : appointment.owner;
    const notification = await Notification.create({
      recipient: recipientId,
      sender: req.user.id,
      title: 'Time Change Proposed',
      message: `A new time has been proposed for the appointment`,
      type: 'appointment',
      data: { appointmentId: appointment._id }
    });
    if (global.io) {
      emitToUser(global.io, recipientId, 'time_change_proposed', {
        appointment,
        notification
      });
    }
    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};
const completeAppointment = async (req, res, next) => {
  try {
    const { diagnosis, treatment, prescription, followUpDate } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    if (appointment.vet.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only the assigned veterinarian can complete this appointment'
      });
    }
    appointment.status = 'completed';
    appointment.diagnosis = diagnosis;
    appointment.treatment = treatment;
    appointment.prescription = prescription;
    appointment.followUpDate = followUpDate;
    await appointment.save();
    await appointment.populate([
      { path: 'pet', select: 'name species breed' },
      { path: 'owner', select: 'name email phone' },
      { path: 'vet', select: 'name profile.specialization' }
    ]);
    const notification = await Notification.create({
      recipient: appointment.owner,
      sender: req.user.id,
      title: 'Appointment Completed',
      message: `Appointment for ${appointment.pet.name} has been completed`,
      type: 'appointment',
      data: { appointmentId: appointment._id }
    });
    if (global.io) {
      emitToUser(global.io, appointment.owner, 'appointment_completed', {
        appointment,
        notification
      });
    }
    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};
const cancelAppointment = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    const isOwner = appointment.owner.toString() === req.user.id;
    const isVet = appointment.vet.toString() === req.user.id;
    if (!isOwner && !isVet && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this appointment'
      });
    }
    appointment.status = 'cancelled';
    appointment.notes = `${appointment.notes || ''}\nCancelled by ${req.user.name}: ${reason || 'No reason provided'}`;
    await appointment.save();
    await appointment.populate([
      { path: 'pet', select: 'name species breed' },
      { path: 'owner', select: 'name email phone' },
      { path: 'vet', select: 'name profile.specialization' }
    ]);
    const recipientId = isOwner ? appointment.vet : appointment.owner;
    const notification = await Notification.create({
      recipient: recipientId,
      sender: req.user.id,
      title: 'Appointment Cancelled',
      message: `Appointment for ${appointment.pet.name} has been cancelled`,
      type: 'appointment',
      data: { appointmentId: appointment._id }
    });
    if (global.io) {
      emitToUser(global.io, recipientId, 'appointment_cancelled', {
        appointment,
        notification
      });
    }
    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  acceptAppointment,
  proposeTimeChange,
  completeAppointment,
  cancelAppointment
};