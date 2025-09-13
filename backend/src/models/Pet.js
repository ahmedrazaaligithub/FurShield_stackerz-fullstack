const mongoose = require('mongoose');
const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a pet name'],
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  species: {
    type: String,
    required: [true, 'Please specify the species'],
    enum: ['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'hamster', 'guinea-pig', 'other']
  },
  breed: {
    type: String,
    maxlength: [50, 'Breed cannot be more than 50 characters']
  },
  age: {
    type: Number,
    required: [true, 'Please add the pet age'],
    min: [0, 'Age cannot be negative'],
    max: [30, 'Age cannot be more than 30 years']
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative'],
    max: [200, 'Weight cannot be more than 200 kg']
  },
  gender: {
    type: String,
    required: [true, 'Please specify the gender'],
    enum: ['male', 'female']
  },
  color: {
    type: String,
    maxlength: [50, 'Color cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  medicalHistory: {
    type: String,
    maxlength: [1000, 'Medical history cannot be more than 1000 characters']
  },
  vaccinations: [{
    name: String,
    date: Date,
    nextDue: Date
  }],
  allergies: [String],
  medications: [String],
  photos: [String],
  microchipId: String,
  isNeutered: {
    type: Boolean,
    default: false
  },
  healthStatus: {
    type: String,
    enum: ['healthy', 'needs-attention', 'critical'],
    default: 'healthy'
  },
  medicalConditions: [String],
  vetContact: {
    type: String,
    maxlength: [100, 'Vet contact cannot be more than 100 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
petSchema.virtual('healthRecords', {
  ref: 'HealthRecord',
  localField: '_id',
  foreignField: 'pet',
  justOne: false
});
petSchema.virtual('appointments', {
  ref: 'Appointment',
  localField: '_id',
  foreignField: 'pet',
  justOne: false
});
petSchema.index({ owner: 1 });
petSchema.index({ species: 1 });
petSchema.index({ name: 1, owner: 1 });
module.exports = mongoose.model('Pet', petSchema);