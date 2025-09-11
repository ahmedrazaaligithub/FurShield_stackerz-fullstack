const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No user found with this token'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Authentication required.'
      });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Account is inactive.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
    }

    if (req.user.role === 'admin' && !req.user.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin account not verified.'
      });
    }

    next();
  };
};

const checkVetVerification = (req, res, next) => {
  if (req.user.role === 'vet' && !req.user.isVerified) {
    return res.status(403).json({
      success: false,
      error: 'Vet account must be verified to access this resource'
    });
  }
  next();
};

module.exports = { protect, authorize, checkVetVerification };
