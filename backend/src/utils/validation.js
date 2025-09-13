const Joi = require('joi');
const passwordRegex = /^(?=.{10,64}$)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^\w\s]).*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneRegex = /^\+?[1-9][\d\s]{6,14}$/;
const normalizePhoneNumber = (phone) => {
  if (!phone) return phone;
  return phone.replace(/\s+/g, '');
};
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().pattern(emailRegex).required(),
  password: Joi.string().pattern(passwordRegex).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match'
  }),
  role: Joi.string().valid('owner', 'vet', 'shelter', 'admin').default('owner'),
  phone: Joi.string().pattern(phoneRegex).required(),
  address: Joi.string().min(5).max(200).required(),
  licenseNumber: Joi.when('role', {
    is: 'vet',
    then: Joi.string().min(5).max(50).required(),
    otherwise: Joi.forbidden()
  }),
  specialization: Joi.when('role', {
    is: 'vet',
    then: Joi.array().items(Joi.string().valid(
      'general', 'surgery', 'dermatology', 'cardiology', 'neurology', 
      'oncology', 'orthopedic', 'ophthalmology', 'dentistry', 'emergency',
      'exotic', 'behavior', 'internal-medicine', 'reproduction'
    )).min(1).required(),
    otherwise: Joi.forbidden()
  }),
  experience: Joi.when('role', {
    is: 'vet',
    then: Joi.number().min(0).max(50).required(),
    otherwise: Joi.forbidden()
  }),
  clinicName: Joi.when('role', {
    is: 'vet',
    then: Joi.string().min(2).max(100).required(),
    otherwise: Joi.forbidden()
  }),
  clinicAddress: Joi.when('role', {
    is: 'vet',
    then: Joi.string().min(5).max(200).required(),
    otherwise: Joi.forbidden()
  }),
  consultationFee: Joi.when('role', {
    is: 'vet',
    then: Joi.number().min(0).max(10000).required(),
    otherwise: Joi.forbidden()
  }),
  availableHours: Joi.when('role', {
    is: 'vet',
    then: Joi.object({
      monday: Joi.object({
        start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        available: Joi.boolean().default(false)
      }),
      tuesday: Joi.object({
        start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        available: Joi.boolean().default(false)
      }),
      wednesday: Joi.object({
        start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        available: Joi.boolean().default(false)
      }),
      thursday: Joi.object({
        start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        available: Joi.boolean().default(false)
      }),
      friday: Joi.object({
        start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        available: Joi.boolean().default(false)
      }),
      saturday: Joi.object({
        start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        available: Joi.boolean().default(false)
      }),
      sunday: Joi.object({
        start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        available: Joi.boolean().default(false)
      })
    }).required(),
    otherwise: Joi.forbidden()
  }),
  languages: Joi.when('role', {
    is: 'vet',
    then: Joi.array().items(Joi.string()).min(1).required(),
    otherwise: Joi.forbidden()
  }),
  bio: Joi.when('role', {
    is: 'vet',
    then: Joi.string().min(50).max(1000).required(),
    otherwise: Joi.forbidden()
  })
});
const loginSchema = Joi.object({
  email: Joi.string().pattern(emailRegex).required(),
  password: Joi.string().required()
});
const petSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  species: Joi.string().valid('dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'hamster', 'guinea-pig', 'other').required(),
  breed: Joi.string().max(50).required(),
  age: Joi.number().min(0).max(30).required(),
  weight: Joi.number().min(0).max(200).optional(),
  gender: Joi.string().valid('male', 'female').required(),
  color: Joi.string().max(50).optional(),
  healthStatus: Joi.string().valid('healthy', 'needs-attention', 'critical').optional(),
  medicalConditions: Joi.array().items(Joi.string()).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  medications: Joi.array().items(Joi.string()).optional(),
  photos: Joi.array().items(Joi.string()).optional(),
  vetContact: Joi.string().max(100).optional(),
  microchipId: Joi.string().max(50).optional(),
  notes: Joi.string().max(1000).optional(),
  description: Joi.string().max(500).optional(),
  medicalHistory: Joi.string().max(1000).optional(),
  vaccinations: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    date: Joi.date().optional(),
    nextDue: Joi.date().optional()
  })).optional()
});
const documentSchema = Joi.object({
  type: Joi.string().valid('vet-certificate', 'lab-report', 'insurance-document', 'vaccination-record', 'medical-report', 'x-ray', 'prescription', 'other').required(),
  category: Joi.string().valid('medical', 'insurance', 'legal', 'identification', 'other').optional(),
  title: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  issuedDate: Joi.date().optional(),
  expiryDate: Joi.date().optional(),
  issuedBy: Joi.string().max(100).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isPrivate: Joi.boolean().optional(),
  metadata: Joi.object({
    veterinarian: Joi.string().optional(),
    clinic: Joi.string().optional(),
    testType: Joi.string().optional(),
    results: Joi.string().optional(),
    insuranceProvider: Joi.string().optional(),
    policyNumber: Joi.string().optional(),
    claimNumber: Joi.string().optional()
  }).optional()
});
const appointmentSchema = Joi.object({
  petId: Joi.string().required(),
  vetId: Joi.string().required(),
  appointmentDate: Joi.date().min('now').required(),
  reason: Joi.string().max(200).required(),
  notes: Joi.string().max(500).optional()
});
const shelterCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(1000).allow(''),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().allow(''),
    zipCode: Joi.string().allow(''),
    country: Joi.string().min(2).max(100).required()
  }).required(),
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2)
  }).optional(),
  phone: Joi.string().pattern(phoneRegex).allow(''),
  email: Joi.string().pattern(emailRegex).allow(''),
  website: Joi.string().uri().allow(''),
  capacity: Joi.number().min(1).optional(),
  services: Joi.array().items(Joi.string().valid('adoption', 'fostering', 'medical-care', 'grooming', 'training', 'boarding')).optional(),
  operatingHours: Joi.object({
    monday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() }),
    tuesday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() }),
    wednesday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() }),
    thursday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() }),
    friday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() }),
    saturday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() }),
    sunday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() })
  }).optional(),
  photos: Joi.array().items(Joi.string()).optional(),
  documents: Joi.array().items(Joi.alternatives(Joi.string(), Joi.object({ type: Joi.string(), filename: Joi.string(), originalName: Joi.string() }))).optional(),
  licenseNumber: Joi.string().allow(''),
  socialMedia: Joi.object({ facebook: Joi.string().allow(''), instagram: Joi.string().allow(''), twitter: Joi.string().allow('') }).optional(),
  donationInfo: Joi.object({
    acceptsDonations: Joi.boolean().default(true),
    paymentMethods: Joi.array().items(Joi.string()).optional(),
    wishList: Joi.array().items(Joi.string()).optional()
  }).optional()
});
const shelterUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(1000).allow(''),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().min(2).max(100).optional(),
    state: Joi.string().allow(''),
    zipCode: Joi.string().allow(''),
    country: Joi.string().min(2).max(100).optional()
  }).optional(),
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2)
  }).optional(),
  phone: Joi.string().pattern(phoneRegex).allow(''),
  email: Joi.string().pattern(emailRegex).allow(''),
  website: Joi.string().uri().allow(''),
  capacity: Joi.number().min(1).optional(),
  services: Joi.array().items(Joi.string().valid('adoption', 'fostering', 'medical-care', 'grooming', 'training', 'boarding')).optional(),
  operatingHours: Joi.object({
    monday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() }),
    tuesday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() }),
    wednesday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() }),
    thursday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() }),
    friday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() }),
    saturday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() }),
    sunday: Joi.object({ open: Joi.string().allow(''), close: Joi.string().allow(''), closed: Joi.boolean() })
  }).optional(),
  photos: Joi.array().items(Joi.string()).optional(),
  documents: Joi.array().items(Joi.alternatives(Joi.string(), Joi.object({ type: Joi.string(), filename: Joi.string(), originalName: Joi.string() }))).optional(),
  licenseNumber: Joi.string().allow(''),
  socialMedia: Joi.object({ facebook: Joi.string().allow(''), instagram: Joi.string().allow(''), twitter: Joi.string().allow('') }).optional(),
  donationInfo: Joi.object({
    acceptsDonations: Joi.boolean(),
    paymentMethods: Joi.array().items(Joi.string()).optional(),
    wishList: Joi.array().items(Joi.string()).optional()
  }).optional(),
  isVerified: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
});
const healthRecordSchema = Joi.object({
  type: Joi.string().valid('checkup', 'vaccination', 'surgery', 'treatment', 'emergency', 'lab-result', 'other').required(),
  title: Joi.string().min(1).max(100).required(),
  description: Joi.string().min(1).max(1000).required(),
  diagnosis: Joi.string().max(1000).optional(),
  treatment: Joi.string().max(2000).optional(),
  symptoms: Joi.array().items(Joi.object({
    name: Joi.string().min(1).max(100).required(),
    severity: Joi.string().valid('mild', 'moderate', 'severe').default('mild'),
    duration: Joi.string().max(100).allow(''),
    notes: Joi.string().max(300).allow('')
  })).optional(),
  medications: Joi.array().items(Joi.object({
    name: Joi.string().min(1).max(100).required(),
    dosage: Joi.string().max(100).allow(''),
    frequency: Joi.string().max(100).allow(''),
    duration: Joi.string().max(100).allow(''),
    instructions: Joi.string().max(500).allow('')
  })).optional(),
  vitals: Joi.object({
    temperature: Joi.number().min(80).max(120).optional(),
    weight: Joi.number().min(0).max(500).optional(),
    heartRate: Joi.number().min(0).max(400).optional(),
    respiratoryRate: Joi.number().min(0).max(200).optional(),
    bloodPressure: Joi.string().max(20).optional()
  }).optional(),
  labResults: Joi.array().items(Joi.object({
    testName: Joi.string().min(1).max(100).required(),
    result: Joi.string().max(500).allow(''),
    normalRange: Joi.string().max(100).allow(''),
    notes: Joi.string().max(300).allow('')
  })).optional(),
  followUpRequired: Joi.boolean().default(false),
  followUpDate: Joi.date().optional(),
  followUpNotes: Joi.string().max(500).allow(''),
  isPrivate: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().max(30)).optional()
}).unknown(false); 
const adoptionListingSchema = Joi.object({
  petId: Joi.string().required(),
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  requirements: Joi.string().max(500).optional(),
  adoptionFee: Joi.number().min(0).max(10000).optional(),
  size: Joi.string().valid('small', 'medium', 'large', 'extra-large').optional(),
  energyLevel: Joi.string().valid('low', 'medium', 'high').optional(),
  specialNeeds: Joi.boolean().optional(),
  specialNeedsDescription: Joi.string().max(500).optional(),
  goodWith: Joi.object({
    children: Joi.boolean().optional(),
    dogs: Joi.boolean().optional(),
    cats: Joi.boolean().optional()
  }).optional(),
  temperament: Joi.array().items(Joi.string().max(50)).optional(),
  photos: Joi.array().items(Joi.string()).optional()
});
const ratingSchema = Joi.object({
  targetId: Joi.string().required(),
  targetType: Joi.string().valid('vet', 'shelter').required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(300).optional()
});
const paymentProviderSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  publicKey: Joi.string().required(),
  secretKey: Joi.string().required(),
  sandboxMode: Joi.boolean().default(true),
  config: Joi.object().optional()
});
module.exports = {
  registerSchema,
  loginSchema,
  petSchema,
  documentSchema,
  appointmentSchema,
  healthRecordSchema,
  shelterCreateSchema,
  shelterUpdateSchema,
  adoptionListingSchema,
  ratingSchema,
  paymentProviderSchema,
  passwordRegex,
  emailRegex,
  phoneRegex,
  normalizePhoneNumber
};