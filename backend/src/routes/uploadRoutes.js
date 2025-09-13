const express = require('express');
const {
  upload,
  uploadSingle,
  uploadMultiple,
  deleteFile
} = require('../controllers/uploadController');
const { protect } = require('../middlewares/auth');
const router = express.Router();
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
router.use(protect);
router.post('/single', upload.single('file'), uploadSingle);
router.post('/product', upload.single('image'), (req, res, next) => {
  req.body.type = 'product';
  uploadSingle(req, res, next);
});
router.post('/multiple', upload.array('files', 10), uploadMultiple);
router.delete('/file', deleteFile);
module.exports = router;