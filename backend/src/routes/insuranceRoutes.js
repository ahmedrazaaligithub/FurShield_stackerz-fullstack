const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getInsurancePolicies,
  addInsurancePolicy,
  updateInsurancePolicy,
  deleteInsurancePolicy,
  addClaim,
  updateClaimStatus,
  getInsuranceClaims
} = require('../controllers/insuranceController');
router.use(protect);
router.get('/pets/:petId/policies', getInsurancePolicies);
router.post('/pets/:petId/policies', addInsurancePolicy);
router.put('/pets/:petId/policies/:policyId', updateInsurancePolicy);
router.delete('/pets/:petId/policies/:policyId', deleteInsurancePolicy);
router.get('/pets/:petId/claims', getInsuranceClaims);
router.post('/pets/:petId/claims', addClaim);
router.put('/pets/:petId/claims/:claimId/status', updateClaimStatus);
module.exports = router;