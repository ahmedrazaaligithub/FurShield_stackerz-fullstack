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
const { petSchema } = require('../utils/validation');

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

router.get('/', getPets);
router.post('/', validate(petSchema), createPet);
router.get('/user/:userId', getUserPets);
router.get('/:id', getPet);
router.put('/:id', updatePet);
router.delete('/:id', deletePet);
router.post('/:id/photos', upload.array('photos', 5), uploadPetPhoto);
router.get('/:id/health-records', getHealthRecords);
router.post('/:id/health-records', authorize('vet'), addHealthRecord);

module.exports = router;
