const AdoptionListing = require('../models/AdoptionListing');
const Pet = require('../models/Pet');
const Shelter = require('../models/Shelter');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { sendAdoptionStatusUpdate } = require('../services/emailService');
const { emitToUser } = require('../sockets/socketHandler');
const getShelterListingsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view these listings'
      });
    }
    const shelter = await Shelter.findOne({ user: userId });
    if (!shelter) {
      return res.json({ success: true, data: [] });
    }
    const listings = await AdoptionListing.find({ shelter: shelter._id, isActive: true })
      .populate('pet')
      .populate('shelter', 'name address phone email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: listings });
  } catch (error) {
    next(error);
  }
};
const getAdoptionListings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const filter = { isActive: true };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.species) filter['pet.species'] = req.query.species;
    if (req.query.size) filter.size = req.query.size;
    if (req.query.energyLevel) filter.energyLevel = req.query.energyLevel;
    if (req.query.goodWithChildren) filter['goodWith.children'] = true;
    if (req.query.goodWithDogs) filter['goodWith.dogs'] = true;
    if (req.query.goodWithCats) filter['goodWith.cats'] = true;
    if (req.query.featured === 'true') filter.featured = true;
    const listings = await AdoptionListing.find(filter)
      .populate('pet')
      .populate('shelter', 'name address phone email')
      .skip(skip)
      .limit(limit)
      .sort({ featured: -1, priority: -1, createdAt: -1 });
    const total = await AdoptionListing.countDocuments(filter);
    res.json({
      success: true,
      data: listings,
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
const getAdoptionListing = async (req, res, next) => {
  try {
    const listing = await AdoptionListing.findById(req.params.id)
      .populate('pet')
      .populate('shelter')
      .populate('inquiries.user', 'name email phone');
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Adoption listing not found'
      });
    }
    listing.views += 1;
    await listing.save();
    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    next(error);
  }
};
const createAdoptionListing = async (req, res, next) => {
  try {
    const { petId } = req.body;
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    let shelter = await Shelter.findOne({ user: req.user.id });
    if (!shelter) {
      shelter = await Shelter.create({
        user: req.user.id,
        name: req.user.name + "'s Shelter",
        address: {
          street: req.user.address || 'Not specified',
          city: 'Not specified',
          state: 'Not specified',
          zipCode: 'Not specified',
          country: 'Not specified'
        },
        phone: req.user.phone || 'Not specified',
        email: req.user.email,
        description: 'Auto-created shelter profile',
        services: ['adoption'],
        isVerified: false,
        isActive: true
      });
    }
    if (pet.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create a listing for this pet'
      });
    }
    const existingListing = await AdoptionListing.findOne({
      pet: petId,
      status: { $in: ['available', 'pending'] }
    });
    if (existingListing) {
      return res.status(400).json({
        success: false,
        error: 'Active adoption listing already exists for this pet'
      });
    }
    const listing = await AdoptionListing.create({
      ...req.body,
      pet: petId,
      shelter: shelter._id
    });
    await listing.populate([
      { path: 'pet' },
      { path: 'shelter', select: 'name address phone email' }
    ]);
    await AuditLog.create({
      user: req.user._id,
      action: 'adoption_listing_creation',
      resource: 'adoption_listing',
      resourceId: listing._id.toString(),
      details: { petId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(201).json({
      success: true,
      data: listing
    });
  } catch (error) {
    next(error);
  }
};
const updateAdoptionListing = async (req, res, next) => {
  try {
    let listing = await AdoptionListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Adoption listing not found'
      });
    }
    const shelter = await Shelter.findById(listing.shelter);
    if (shelter.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this listing'
      });
    }
    listing = await AdoptionListing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'pet' },
      { path: 'shelter', select: 'name address phone email' }
    ]);
    await AuditLog.create({
      user: req.user._id,
      action: 'adoption_listing_update',
      resource: 'adoption_listing',
      resourceId: req.params.id,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    next(error);
  }
};
const deleteAdoptionListing = async (req, res, next) => {
  try {
    const listing = await AdoptionListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Adoption listing not found'
      });
    }
    const shelter = await Shelter.findById(listing.shelter);
    if (shelter.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this listing'
      });
    }
    listing.isActive = false;
    await listing.save();
    await AuditLog.create({
      user: req.user._id,
      action: 'adoption_listing_deletion',
      resource: 'adoption_listing',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Adoption listing deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
const submitInquiry = async (req, res, next) => {
  try {
    const { message, applicationForm } = req.body;
    const listing = await AdoptionListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Adoption listing not found'
      });
    }
    if (listing.status !== 'available') {
      return res.status(400).json({
        success: false,
        error: 'This pet is no longer available for adoption'
      });
    }
    const existingInquiry = listing.inquiries.find(
      inquiry => inquiry.user.toString() === req.user.id
    );
    if (existingInquiry) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted an inquiry for this pet'
      });
    }
    listing.inquiries.push({
      user: req.user.id,
      message,
      applicationForm
    });
    await listing.save();
    await listing.populate([
      { path: 'pet' },
      { path: 'shelter', populate: { path: 'user', select: 'name email' } }
    ]);
    const notification = await Notification.create({
      recipient: listing.shelter.user._id,
      sender: req.user.id,
      title: 'New Adoption Inquiry',
      message: `New adoption inquiry for ${listing.pet.name}`,
      type: 'adoption',
      data: { listingId: listing._id }
    });
    if (global.io) {
      emitToUser(global.io, listing.shelter.user._id, 'new_adoption_inquiry', {
        listing,
        notification
      });
    }
    res.json({
      success: true,
      message: 'Inquiry submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};
const updateInquiryStatus = async (req, res, next) => {
  try {
    const { inquiryId, status, notes } = req.body;
    const listing = await AdoptionListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Adoption listing not found'
      });
    }
    const shelter = await Shelter.findById(listing.shelter);
    if (shelter.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update inquiry status'
      });
    }
    const inquiry = listing.inquiries.id(inquiryId);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: 'Inquiry not found'
      });
    }
    inquiry.status = status;
    if (notes) inquiry.notes = notes;
    if (status === 'approved') {
      listing.status = 'pending';
      listing.adoptedBy = inquiry.user;
    }
    await listing.save();
    await listing.populate('inquiries.user', 'name email');
    await sendAdoptionStatusUpdate(listing, inquiry.user, status);
    const notification = await Notification.create({
      recipient: inquiry.user,
      sender: req.user.id,
      title: `Adoption Application ${status}`,
      message: `Your adoption application for ${listing.title} has been ${status}`,
      type: 'adoption',
      data: { listingId: listing._id }
    });
    if (global.io) {
      emitToUser(global.io, inquiry.user, 'adoption_status_update', {
        listing,
        status,
        notification
      });
    }
    await AuditLog.create({
      user: req.user._id,
      action: 'adoption_inquiry_status_update',
      resource: 'adoption_listing',
      resourceId: req.params.id,
      details: { inquiryId, status },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: `Inquiry ${status} successfully`
    });
  } catch (error) {
    next(error);
  }
};
const completeAdoption = async (req, res, next) => {
  try {
    const listing = await AdoptionListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Adoption listing not found'
      });
    }
    const shelter = await Shelter.findById(listing.shelter);
    if (shelter.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to complete this adoption'
      });
    }
    listing.status = 'adopted';
    listing.adoptedAt = new Date();
    await listing.save();
    shelter.stats.totalAdoptions += 1;
    await shelter.save();
    await AuditLog.create({
      user: req.user._id,
      action: 'adoption_completion',
      resource: 'adoption_listing',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Adoption completed successfully'
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getAdoptionListings,
  getAdoptionListing,
  createAdoptionListing,
  updateAdoptionListing,
  deleteAdoptionListing,
  submitInquiry,
  updateInquiryStatus,
  completeAdoption,
  getShelterListingsByUser
};