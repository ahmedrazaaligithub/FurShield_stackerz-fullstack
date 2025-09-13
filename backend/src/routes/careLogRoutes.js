const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getCareLogs,
  addCareLog,
  updateCareLog,
  deleteCareLog,
  getCareLogsByPet,
  getCareLogsByShelter
} = require('../controllers/careLogController');
router.use(protect);
router.get('/shelter/:shelterId', authorize('shelter', 'admin'), getCareLogsByShelter);
router.get('/pet/:petId', getCareLogs);
router.post('/pet/:petId', authorize('shelter'), addCareLog);
router.put('/:logId', authorize('shelter'), updateCareLog);
router.delete('/:logId', authorize('shelter'), deleteCareLog);
module.exports = router;