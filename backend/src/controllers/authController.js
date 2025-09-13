const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendEmail, sendEmailVerification } = require('../services/emailService');
const { normalizePhoneNumber } = require('../utils/validation');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const generateTokens = (user) => {
  const accessToken = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();
  return { accessToken, refreshToken };
};
const setRefreshTokenCookie = (res, refreshToken) => {
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  res.cookie('refreshToken', refreshToken, options);
};
const register = async (req, res, next) => {
  try {
    const { 
      name, email, password, confirmPassword, role, phone, address,
      licenseNumber, specialization, experience, clinicName, clinicAddress,
      consultationFee, availableHours, languages, bio
    } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }
    const normalizedPhone = phone ? normalizePhoneNumber(phone) : phone;
    const userData = {
      name,
      email,
      password,
      role,
      phone: normalizedPhone,
      address
    };
    if (role === 'vet') {
      userData.profile = {
        bio,
        licenseNumber,
        specialization,
        experience: parseInt(experience),
        clinicName,
        clinicAddress,
        consultationFee: parseFloat(consultationFee),
        availableHours,
        languages
      };
    } else {
      userData.profile = {
        availableHours: {
          monday: { available: false },
          tuesday: { available: false },
          wednesday: { available: false },
          thursday: { available: false },
          friday: { available: false },
          saturday: { available: false },
          sunday: { available: false }
        },
        specialization: [],
        languages: [],
        conditions: []
      };
    }
    const user = await User.create(userData);
    const emailVerificationToken = crypto.randomBytes(20).toString('hex');
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; 
    await user.save();
    await sendEmailVerification(user, emailVerificationToken);
    if (role === 'vet') {
      user.isVetVerified = false; 
      await user.save();
      await AuditLog.create({
        user: user._id,
        action: 'vet_verification_request',
        resource: 'user',
        resourceId: user._id.toString(),
        details: { email, role, status: 'pending' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    await AuditLog.create({
      user: user._id,
      action: 'user_registration',
      resource: 'user',
      resourceId: user._id.toString(),
      details: { email, role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshTokenCookie(res, refreshToken);
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          emailVerified: user.emailVerified
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    const isMatch = await user.matchPassword(password);
    if (user.loginAttempts > 0) {
      await user.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
      });
    }
    user.lastLogin = new Date();
    await user.save();
    await AuditLog.create({
      user: user._id,
      action: 'user_login',
      resource: 'user',
      resourceId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshTokenCookie(res, refreshToken);
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          address: user.address,
          bio: user.bio,
          isVerified: user.isVerified,
          emailVerified: user.emailVerified,
          isEmailVerified: user.emailVerified,
          createdAt: user.createdAt
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};
const logout = async (req, res, next) => {
  try {
    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    await AuditLog.create({
      user: req.user._id,
      action: 'user_logout',
      resource: 'user',
      resourceId: req.user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided'
      });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    setRefreshTokenCookie(res, newRefreshToken);
    res.json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
};
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No user found with this email'
      });
    }
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpire = Date.now() + 10 * 60 * 1000;
    await user.save();
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Password Reset - PetCare',
      message: `You are receiving this email because you requested a password reset. Please click this link to reset your password: ${resetUrl}`
    });
    res.json({
      success: true,
      message: 'Email sent'
    });
  } catch (error) {
    next(error);
  }
};
const resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
    const user = await User.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpire: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();
    await AuditLog.create({
      user: user._id,
      action: 'password_reset',
      resource: 'user',
      resourceId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshTokenCookie(res, refreshToken);
    res.json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token || token.length !== 40) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification token format'
      });
    }
    const user = await User.findOne({ 
      emailVerificationToken: token
    });
    if (!user) {
      const verifiedUser = await User.findOne({
        $or: [
          { emailVerificationToken: token, isEmailVerified: true },
          { email: { $exists: true }, isEmailVerified: true }
        ]
      });
      if (verifiedUser && verifiedUser.emailVerificationToken === token) {
        verifiedUser.emailVerificationToken = undefined;
        verifiedUser.emailVerificationExpires = undefined;
        await verifiedUser.save();
        return res.json({
          success: true,
          message: 'Email is already verified',
          alreadyVerified: true
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }
    if (user.emailVerified) {
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
      return res.json({
        success: true,
        message: 'Email is already verified',
        alreadyVerified: true
      });
    }
    if (user.emailVerificationExpires && user.emailVerificationExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Verification token has expired. Please request a new verification email.'
      });
    }
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    await AuditLog.create({
      user: user._id,
      action: 'email_verification',
      resource: 'user',
      resourceId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        isEmailVerified: user.emailVerified,
        isVetVerified: user.isVetVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'address', 'bio'];
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    await AuditLog.create({
      user: req.user._id,
      action: 'profile_update',
      resource: 'user',
      resourceId: req.user._id.toString(),
      details: updates,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
  updateProfile
};