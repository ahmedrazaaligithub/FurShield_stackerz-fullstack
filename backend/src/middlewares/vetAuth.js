const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Middleware to check if user is a verified veterinarian
const checkVetVerification = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user is a vet
    if (req.user.role !== 'vet') {
      await AuditLog.create({
        user: req.user._id,
        action: 'unauthorized_vet_access',
        resource: 'vet_operation',
        details: { 
          reason: 'User is not a veterinarian',
          userRole: req.user.role,
          endpoint: req.originalUrl
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(403).json({
        success: false,
        error: 'Access denied. Veterinarian role required.'
      });
    }

    // Check if vet is verified
    if (!req.user.isVetVerified) {
      await AuditLog.create({
        user: req.user._id,
        action: 'unverified_vet_access',
        resource: 'vet_operation',
        details: { 
          reason: 'Veterinarian not verified',
          isVetVerified: req.user.isVetVerified,
          endpoint: req.originalUrl
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(403).json({
        success: false,
        error: 'Access denied. Veterinarian verification required. Please wait for admin approval.'
      });
    }

    // Check if vet account is active
    if (!req.user.isActive) {
      await AuditLog.create({
        user: req.user._id,
        action: 'inactive_vet_access',
        resource: 'vet_operation',
        details: { 
          reason: 'Veterinarian account is inactive',
          isActive: req.user.isActive,
          endpoint: req.originalUrl
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(403).json({
        success: false,
        error: 'Access denied. Account is inactive.'
      });
    }

    next();
  } catch (error) {
    console.error('Vet verification middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during verification check'
    });
  }
};

// Middleware to check if user can access vet-related resources (for pet owners booking appointments)
const checkVetAccess = async (req, res, next) => {
  try {
    const { vetId } = req.params;
    
    if (!vetId) {
      return res.status(400).json({
        success: false,
        error: 'Veterinarian ID required'
      });
    }

    const vet = await User.findById(vetId);
    
    if (!vet) {
      return res.status(404).json({
        success: false,
        error: 'Veterinarian not found'
      });
    }

    if (vet.role !== 'vet') {
      return res.status(400).json({
        success: false,
        error: 'Invalid veterinarian ID'
      });
    }

    if (!vet.isVetVerified) {
      return res.status(403).json({
        success: false,
        error: 'This veterinarian is not yet verified'
      });
    }

    if (!vet.isActive) {
      return res.status(403).json({
        success: false,
        error: 'This veterinarian account is inactive'
      });
    }

    // Add vet info to request for use in controllers
    req.vet = vet;
    next();
  } catch (error) {
    console.error('Vet access middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during vet access check'
    });
  }
};

// Middleware to ensure only the vet themselves or admin can access vet profile updates
const checkVetOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Admin can access any vet profile
    if (req.user.role === 'admin') {
      return next();
    }

    // Vet can only access their own profile
    if (req.user.role === 'vet' && req.user._id.toString() === id) {
      return next();
    }

    await AuditLog.create({
      user: req.user._id,
      action: 'unauthorized_vet_profile_access',
      resource: 'vet_profile',
      resourceId: id,
      details: { 
        reason: 'Attempted to access another vet profile',
        requestedVetId: id,
        userRole: req.user.role
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(403).json({
      success: false,
      error: 'Access denied. You can only access your own profile.'
    });
  } catch (error) {
    console.error('Vet ownership middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during ownership check'
    });
  }
};

module.exports = {
  checkVetVerification,
  checkVetAccess,
  checkVetOwnership
};
