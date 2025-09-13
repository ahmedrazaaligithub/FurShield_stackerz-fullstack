const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
  uploadPetPhoto,
  getHealthRecords,
  addHealthRecord,
  getUserPets
} = require('../controllers/petController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { petSchema, healthRecordSchema } = require('../utils/validation');
const { checkPetOwnership } = require('../middlewares/ownershipCheck');
const { checkVetPetAccess, getVetAuthorizedPets, checkVetHealthRecordAccess } = require('../middlewares/vetPetAccess');
const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/pets');
    if (!require('fs').existsSync(uploadPath)) {
      require('fs').mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
router.use(protect);
router.get('/user', authorize('owner', 'shelter', 'vet', 'admin'), getVetAuthorizedPets, getUserPets);
router.get('/user/:userId', authorize('owner', 'shelter', 'admin'), getUserPets);
router.get('/', authorize('admin', 'vet'), getVetAuthorizedPets, getPets);
router.post('/', authorize('owner', 'shelter'), validate(petSchema), createPet);
router.get('/:id', authorize('owner', 'vet', 'admin'), checkPetOwnership, getPet);
router.put('/:id', authorize('owner', 'shelter'), checkPetOwnership, validate(petSchema), updatePet);
router.delete('/:id', authorize('owner', 'shelter'), checkPetOwnership, deletePet);
router.post('/:id/photo', authorize('owner', 'shelter'), checkPetOwnership, upload.single('photo'), uploadPetPhoto);
router.post('/:id/photos', authorize('owner', 'shelter'), checkPetOwnership, upload.single('photo'), uploadPetPhoto);
router.get('/:id/health-records', authorize('owner', 'vet', 'admin'), checkVetPetAccess, getHealthRecords);
router.post('/:id/health-records', authorize('vet', 'admin'), checkVetHealthRecordAccess, validate(healthRecordSchema), addHealthRecord);
module.exports = router;