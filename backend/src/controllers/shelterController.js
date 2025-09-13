const Shelter = require('../models/Shelter');
const AdoptionListing = require('../models/AdoptionListing');
const AuditLog = require('../models/AuditLog');
const getShelters = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = { isActive: true };
    if (req.query.verified === 'true') filter.isVerified = true;
    if (req.query.city) filter['address.city'] = { $regex: req.query.city, $options: 'i' };
    if (req.query.services) {
      filter.services = { $in: req.query.services.split(',') };
    }
    const shelters = await Shelter.find(filter)
      .populate('user', 'name email')
      .populate('ratings')
      .skip(skip)
      .limit(limit)
      .sort({ isVerified: -1, createdAt: -1 });
    const total = await Shelter.countDocuments(filter);
    res.json({
      success: true,
      data: shelters,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
const getShelter = async (req, res, next) => {
  try {
    const shelter = await Shelter.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('adoptionListings')
      .populate('ratings');
    if (!shelter) {
      return res.status(404).json({
        success: false,
        error: 'Shelter not found'
      });
    }
    res.json({
      success: true,
      data: shelter
    });
  } catch (error) {
    next(error);
  }
};
const getMyShelter = async (req, res, next) => {
  try {
    const shelter = await Shelter.findOne({ user: req.user.id })
      .populate('user', 'name email phone');
    if (!shelter) {
      return res.json({
        success: true,
        data: null,
        message: 'No shelter profile found. Please create one.'
      });
    }
    res.json({
      success: true,
      data: shelter
    });
  } catch (error) {
    next(error);
  }
};
const createShelter = async (req, res, next) => {
  try {
    if (req.user.role !== 'shelter') {
      return res.status(403).json({
        success: false,
        error: 'Only shelter accounts can create shelter profiles'
      });
    }
    const existingShelter = await Shelter.findOne({ user: req.user.id });
    if (existingShelter) {
      return res.status(400).json({
        success: false,
        error: 'Shelter profile already exists for this user'
      });
    }
    const shelter = await Shelter.create({
      ...req.body,
      user: req.user.id
    });
    await shelter.populate('user', 'name email');
    await AuditLog.create({
      user: req.user._id,
      action: 'shelter_creation',
      resource: 'shelter',
      resourceId: shelter._id.toString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(201).json({
      success: true,
      data: shelter
    });
  } catch (error) {
    next(error);
  }
};
const updateShelter = async (req, res, next) => {
  try {
    let shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({
        success: false,
        error: 'Shelter not found'
      });
    }
    if (shelter.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this shelter'
      });
    }
    shelter = await Shelter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name email');
    await AuditLog.create({
      user: req.user._id,
      action: 'shelter_update',
      resource: 'shelter',
      resourceId: req.params.id,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: shelter
    });
  } catch (error) {
    next(error);
  }
};
const deleteShelter = async (req, res, next) => {
  try {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({
        success: false,
        error: 'Shelter not found'
      });
    }
    if (shelter.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this shelter'
      });
    }
    shelter.isActive = false;
    await shelter.save();
    await AuditLog.create({
      user: req.user._id,
      action: 'shelter_deletion',
      resource: 'shelter',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Shelter deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
const verifyShelter = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({
        success: false,
        error: 'Shelter not found'
      });
    }
    shelter.isVerified = status === 'approved';
    if (status === 'approved') {
      shelter.verificationDate = new Date();
    }
    await shelter.save();
    await AuditLog.create({
      user: req.user._id,
      action: 'shelter_verification',
      resource: 'shelter',
      resourceId: req.params.id,
      details: { status, notes },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: `Shelter ${status} successfully`
    });
  } catch (error) {
    next(error);
  }
};
const searchShelters = async (req, res, next) => {
  try {
    const { lat, lng, radius = 50, services } = req.query;
    let filter = { isActive: true, isVerified: true };
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000
        }
      };
    }
    if (services) {
      filter.services = { $in: services.split(',') };
    }
    const shelters = await Shelter.find(filter)
      .populate('user', 'name email')
      .limit(20);
    res.json({
      success: true,
      data: shelters
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getShelters,
  getShelter,
  getMyShelter,
  createShelter,
  updateShelter,
  deleteShelter,
  verifyShelter,
  searchShelters
};