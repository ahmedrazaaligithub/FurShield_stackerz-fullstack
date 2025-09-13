const mongoose = require('mongoose');
const healthRecordSchema = new mongoose.Schema({
  pet: {
    type: mongoose.Schema.ObjectId,
    ref: 'Pet',
    required: true
  },
  vet: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Appointment'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['checkup', 'vaccination', 'surgery', 'treatment', 'emergency', 'lab-result', 'other'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  diagnosis: String,
  treatment: String,
  symptoms: [{
    name: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'mild'
    },
    duration: String,
    notes: String
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  vitals: {
    temperature: Number,
    weight: Number,
    heartRate: Number,
    respiratoryRate: Number,
    bloodPressure: String
  },
  labResults: [{
    testName: String,
    result: String,
    normalRange: String,
    notes: String
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  followUpNotes: String,
  isPrivate: {
    type: Boolean,
    default: false
  },
  tags: [String]
}, {
  timestamps: true
});
healthRecordSchema.index({ pet: 1 });
healthRecordSchema.index({ vet: 1 });
healthRecordSchema.index({ date: -1 });
healthRecordSchema.index({ type: 1 });
module.exports = mongoose.model('HealthRecord', healthRecordSchema);