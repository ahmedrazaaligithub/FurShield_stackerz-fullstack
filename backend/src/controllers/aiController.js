const aiService = require('../services/aiService');
const Pet = require('../models/Pet');
const AuditLog = require('../models/AuditLog');
const askAI = async (req, res, next) => {
  try {
    const { question, context } = req.body;
    if (!aiService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not configured. Please contact administrator.'
      });
    }
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }
    const response = await aiService.generateResponse(question, context);
    await AuditLog.create({
      user: req.user._id,
      action: 'ai_query',
      resource: 'ai_service',
      resourceId: 'general',
      details: { questionLength: question.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: {
        question,
        response,
        disclaimer: 'This information is for educational purposes only. Always consult with a qualified veterinarian for medical advice regarding your pet\'s health.'
      }
    });
  } catch (error) {
    next(error);
  }
};
const getPetCareAdvice = async (req, res, next) => {
  try {
    const { petId, question } = req.body;
    if (!aiService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not configured. Please contact administrator.'
      });
    }
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    if (pet.owner.toString() !== req.user.id && req.user.role !== 'vet') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to get advice for this pet'
      });
    }
    const response = await aiService.getPetCareAdvice(pet, question);
    await AuditLog.create({
      user: req.user._id,
      action: 'ai_pet_advice',
      resource: 'ai_service',
      resourceId: petId,
      details: { questionLength: question.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: {
        pet: {
          name: pet.name,
          species: pet.species,
          breed: pet.breed
        },
        question,
        response,
        disclaimer: 'This information is for educational purposes only. Always consult with a qualified veterinarian for medical advice regarding your pet\'s health.'
      }
    });
  } catch (error) {
    next(error);
  }
};
const getHealthRecommendations = async (req, res, next) => {
  try {
    const { petId, symptoms } = req.body;
    if (!aiService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not configured. Please contact administrator.'
      });
    }
    if (req.user.role !== 'vet' || !req.user.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Only verified veterinarians can access health recommendations'
      });
    }
    const pet = await Pet.findById(petId).populate('owner', 'name email');
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    const response = await aiService.getHealthRecommendations(symptoms, pet);
    await AuditLog.create({
      user: req.user._id,
      action: 'ai_health_recommendations',
      resource: 'ai_service',
      resourceId: petId,
      details: { symptoms },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: {
        pet: {
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          age: pet.age
        },
        symptoms,
        recommendations: response,
        disclaimer: 'These are AI-generated recommendations for informational purposes only. Professional veterinary diagnosis and treatment are essential for proper pet care.'
      }
    });
  } catch (error) {
    next(error);
  }
};
const getAIStatus = async (req, res, next) => {
  try {
    const isEnabled = aiService.isEnabled();
    const provider = process.env.AI_PROVIDER || 'openai';
    res.json({
      success: true,
      data: {
        enabled: isEnabled,
        provider: isEnabled ? provider : null,
        features: {
          generalAdvice: isEnabled,
          petSpecificAdvice: isEnabled,
          healthRecommendations: isEnabled && (req.user.role === 'vet' && req.user.isVerified)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  askAI,
  getPetCareAdvice,
  getHealthRecommendations,
  getAIStatus
};