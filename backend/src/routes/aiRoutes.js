const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  askAI,
  getPetCareAdvice,
  getHealthRecommendations,
  getAIStatus
} = require('../controllers/aiController');
const { protect, authorize, checkVetVerification } = require('../middlewares/auth');
const router = express.Router();
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many AI requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(protect);
router.use(aiLimiter);
router.get('/status', getAIStatus);
router.post('/ask', askAI);
router.post('/pet-advice', getPetCareAdvice);
router.post('/health-recommendations', authorize('vet'), checkVetVerification, getHealthRecommendations);
module.exports = router;