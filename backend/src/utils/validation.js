const Joi = require('joi');

const passwordRegex = /^(?=.{10,64}$)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^\w\s]).*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneRegex = /^\+?[1-9][\d\s]{6,14}$/;

// Function to normalize international phone numbers
const normalizePhoneNumber = (phone) => {
  if (!phone) return phone;
  
  // Remove all spaces to create clean format for database storage
  // Frontend sends "+92 3213265524", we store as "+923213265524"
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
  phone: Joi.string().pattern(phoneRegex).optional(),
  address: Joi.string().min(5).max(200).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().pattern(emailRegex).required(),
  password: Joi.string().required()
});

const petSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  species: Joi.string().valid('dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'hamster', 'guinea-pig', 'other').required(),
  breed: Joi.string().max(50).optional(),
  age: Joi.number().min(0).max(30).required(),
  weight: Joi.number().min(0).max(200).optional(),
  gender: Joi.string().valid('male', 'female').required(),
  color: Joi.string().max(50).optional(),
  healthStatus: Joi.string().valid('healthy', 'needs-attention', 'critical').optional(),
  medicalConditions: Joi.array().items(Joi.string()).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  medications: Joi.array().items(Joi.string()).optional(),
  vetContact: Joi.string().max(100).optional(),
  microchipId: Joi.string().max(50).optional(),
  notes: Joi.string().max(1000).optional(),
  description: Joi.string().max(500).optional(),
  medicalHistory: Joi.string().max(1000).optional(),
  vaccinations: Joi.array().items(Joi.string()).optional()
});

const appointmentSchema = Joi.object({
  petId: Joi.string().required(),
  vetId: Joi.string().required(),
  appointmentDate: Joi.date().min('now').required(),
  reason: Joi.string().max(200).required(),
  notes: Joi.string().max(500).optional()
});

const adoptionListingSchema = Joi.object({
  petId: Joi.string().required(),
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  requirements: Joi.string().max(500).optional(),
  adoptionFee: Joi.number().min(0).max(10000).optional()
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
  appointmentSchema,
  adoptionListingSchema,
  ratingSchema,
  paymentProviderSchema,
  passwordRegex,
  emailRegex,
  phoneRegex,
  normalizePhoneNumber
};
