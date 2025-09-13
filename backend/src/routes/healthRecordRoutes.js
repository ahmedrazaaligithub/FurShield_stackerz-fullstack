const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getHealthRecords,
  addHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  addVaccination,
  addAllergy,
  addMedication,
  addTreatment,
  uploadDocument,
  deleteDocument
} = require('../controllers/healthRecordController');

// All routes require authentication
router.use(protect);

// Pet health records routes
router.get('/pets/:petId/records', getHealthRecords);
router.post('/pets/:petId/records', addHealthRecord);
router.put('/pets/:petId/records/:recordId', updateHealthRecord);
router.delete('/pets/:petId/records/:type/:recordId', deleteHealthRecord);

// Specific record types
router.post('/pets/:petId/vaccinations', addVaccination);
router.post('/pets/:petId/allergies', addAllergy);
router.post('/pets/:petId/medications', addMedication);
router.post('/pets/:petId/treatments', addTreatment);

// Document management
router.post('/pets/:petId/documents', uploadDocument);
router.delete('/pets/:petId/documents/:documentId', deleteDocument);

// Vet-only routes for professional medical records
router.post('/pets/:petId/medical-notes', authorize('vet'), addHealthRecord);

module.exports = router;
