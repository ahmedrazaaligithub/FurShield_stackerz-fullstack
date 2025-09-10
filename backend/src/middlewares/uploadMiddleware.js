const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/profiles',
    'uploads/pets',
    'uploads/products',
    'uploads/temp'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '../..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage for different upload types
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const typeMap = {
      'profile': 'profiles',
      'avatar': 'profiles',
      'pet': 'pets',
      'product': 'products',
      'temp': 'temp'
    };
    
    const uploadType = req.body.type || req.query.type || req.params.type || 'temp';
    const folderName = typeMap[uploadType] || 'temp';
    const uploadPath = path.join(__dirname, '../..', 'uploads', folderName);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${uniqueSuffix}_${name}${ext}`);
  }
});

// File filter for image uploads
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Create multer upload instances
const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: imageFilter
});

// Middleware for handling single image upload
const uploadSingleImage = (fieldName = 'image') => {
  return (req, res, next) => {
    uploadImage.single(fieldName)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      next();
    });
  };
};

// Middleware for handling multiple image uploads
const uploadMultipleImages = (fieldName = 'images', maxCount = 10) => {
  return (req, res, next) => {
    uploadImage.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      next();
    });
  };
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  uploadImage
};
