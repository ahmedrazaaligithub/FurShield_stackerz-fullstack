const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'No user found with this token'
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }
      throw jwtError;
    }
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
      // Log unauthorized access attempt
      const AuditLog = require('../models/AuditLog');
      AuditLog.create({
        user: req.user._id,
        action: 'unauthorized_access_attempt',
        resource: 'route',
        resourceId: req.originalUrl,
        details: { 
          requiredRoles: roles, 
          userRole: req.user.role,
          method: req.method,
          url: req.originalUrl
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }).catch(err => console.error('Audit log error:', err));

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

module.exports = { 
  protect, 
  authenticate: protect, // alias for consistency
  authorize, 
  checkVetVerification 
};
