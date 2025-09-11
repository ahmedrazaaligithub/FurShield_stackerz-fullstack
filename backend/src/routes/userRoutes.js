const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const {
  getUsers,
  getUser,
  updateProfile,
  updateUser,
  deleteUser,
  verifyVet,
  uploadAvatar,
  getVets
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.use(protect);

router.get('/', authorize('admin'), getUsers);
router.get('/vets', getVets);
router.get('/:id', getUser);
router.put('/profile', updateProfile);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.post('/verify-vet', authorize('admin'), verifyVet);
router.post('/upload-avatar', uploadAvatar);
router.get('/avatar', (req, res) => {
  const avatarPath = req.user?.avatar || '/public/default-avatar.svg';
  if (avatarPath.startsWith('/')) {
    return res.redirect(avatarPath);
  }
  res.redirect(`/uploads/profiles/${avatarPath}`);
});

module.exports = router;
