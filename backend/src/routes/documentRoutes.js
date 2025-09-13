const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getPetDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getUserDocuments
} = require('../controllers/documentController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { documentSchema } = require('../utils/validation');
const { checkPetOwnership, checkDocumentOwnership } = require('../middlewares/ownershipCheck');
const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/documents');
    if (!require('fs').existsSync(uploadPath)) {
      require('fs').mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `doc_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, Word, Excel, and text files are allowed.'), false);
  }
};
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, 
    files: 5 
  },
  fileFilter: fileFilter
});
router.use(protect);
router.get('/user', authorize('owner', 'vet', 'admin'), getUserDocuments); 
router.get('/pet/:petId', authorize('owner', 'vet', 'admin'), checkPetOwnership, getPetDocuments); 
router.post('/pet/:petId/upload', authorize('owner', 'vet', 'admin'), checkPetOwnership, upload.array('documents', 5), validate(documentSchema), uploadDocument); 
router.get('/:id', authorize('owner', 'vet', 'admin'), checkDocumentOwnership, getDocument); 
router.put('/:id', authorize('owner', 'vet', 'admin'), checkDocumentOwnership, validate(documentSchema), updateDocument); 
router.delete('/:id', authorize('owner', 'vet', 'admin'), checkDocumentOwnership, deleteDocument); 
module.exports = router;