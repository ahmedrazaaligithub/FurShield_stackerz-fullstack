const mongoose = require('mongoose');
const appointmentSchema = new mongoose.Schema({
  pet: {
    type: mongoose.Schema.ObjectId,
    ref: 'Pet',
    required: true
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  vet: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Please add an appointment date']
  },
  duration: {
    type: Number,
    default: 30
  },
  reason: {
    type: String,
    required: [true, 'Please add a reason for the appointment'],
    maxlength: [200, 'Reason cannot be more than 200 characters']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['consultation', 'checkup', 'vaccination', 'surgery', 'emergency', 'follow-up'],
    default: 'consultation'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  meetingLink: String,
  prescription: {
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    notes: String
  },
  diagnosis: String,
  treatment: String,
  followUpDate: Date,
  cost: {
    consultation: Number,
    treatment: Number,
    medication: Number,
    total: Number
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  vetAccepted: {
    type: Boolean,
    default: false
  },
  vetAcceptedAt: Date,
  proposedTimeChanges: [{
    proposedDate: Date,
    reason: String,
    proposedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
appointmentSchema.virtual('healthRecord', {
  ref: 'HealthRecord',
  localField: '_id',
  foreignField: 'appointment',
  justOne: true
});
appointmentSchema.index({ pet: 1 });
appointmentSchema.index({ owner: 1 });
appointmentSchema.index({ vet: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
module.exports = mongoose.model('Appointment', appointmentSchema);