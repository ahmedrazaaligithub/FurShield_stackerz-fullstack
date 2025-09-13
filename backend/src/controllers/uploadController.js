const multer = require('multer');
const path = require('path');
const fs = require('fs');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const typeMap = {
      'profile': 'profiles',
      'avatar': 'profiles', 
      'pet': 'pets',
      'product': 'products',
      'temp': 'temp'
    };
    const uploadType = req.body.type || req.query.type || 'temp';
    const folderName = typeMap[uploadType] || 'temp';
    const uploadPath = path.join(__dirname, '../../uploads', folderName);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}_${sanitizedName}`);
  }
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    video: ['video/mp4', 'video/mpeg', 'video/quicktime']
  };
  const category = req.body.category || 'image';
  const allowed = allowedTypes[category] || allowedTypes.image;
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Only ${category} files are allowed`), false);
  }
};
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
  },
  fileFilter: fileFilter
});
const uploadSingle = async (req, res, next) => {
  try {
    console.log('Upload request received:', {
      file: req.file ? req.file.filename : 'No file',
      type: req.body.type,
      user: req.user ? req.user._id : 'No user'
    });
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    const typeMap = {
      'profile': 'profiles',
      'avatar': 'profiles', 
      'pet': 'pets',
      'product': 'products',
      'temp': 'temp'
    };
    const uploadType = req.body.type || req.query.type || 'temp';
    const folderName = typeMap[uploadType] || 'temp';
    const fileUrl = `/uploads/${folderName}/${req.file.filename}`;
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        type: uploadType,
        folder: folderName
      }
    });
  } catch (error) {
    next(error);
  }
};
const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    const typeMap = {
      'profile': 'profiles',
      'avatar': 'profiles', 
      'pet': 'pets',
      'product': 'products',
      'temp': 'temp'
    };
    const uploadType = req.body.type || req.query.type || 'temp';
    const folderName = typeMap[uploadType] || 'temp';
    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${folderName}/${file.filename}`,
      type: uploadType,
      folder: folderName
    }));
    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    next(error);
  }
};
const deleteFile = async (req, res, next) => {
  try {
    const { filename, type } = req.body;
    const typeMap = {
      'profile': 'profiles',
      'avatar': 'profiles', 
      'pet': 'pets',
      'product': 'products',
      'temp': 'temp'
    };
    const folderName = typeMap[type] || 'temp';
    const filePath = path.join(__dirname, '../../uploads', folderName, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
  } catch (error) {
    next(error);
  }
};
module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  deleteFile
};