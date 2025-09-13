const Document = require('../models/Document');
const Pet = require('../models/Pet');
const AuditLog = require('../models/AuditLog');
const path = require('path');
const fs = require('fs').promises;
const getPetDocuments = async (req, res, next) => {
  try {
    const { petId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    if (req.user.role === 'owner' && pet.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this pet\'s documents'
      });
    }
    const filter = { 
      pet: petId, 
      isActive: true 
    };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    const documents = await Document.find(filter)
      .populate('uploadedBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await Document.countDocuments(filter);
    res.json({
      success: true,
      data: documents,
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
const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('pet', 'name')
      .populate('owner', 'name email')
      .populate('uploadedBy', 'name email');
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    if (req.user.role === 'owner' && document.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this document'
      });
    }
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};
const uploadDocument = async (req, res, next) => {
  try {
    const { petId } = req.params;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please upload at least one document'
      });
    }
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    if (req.user.role === 'owner' && pet.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to upload documents for this pet'
      });
    }
    const uploadedDocuments = [];
    for (const file of req.files) {
      const documentData = {
        owner: pet.owner,
        pet: petId,
        type: req.body.type || 'other',
        category: req.body.category || 'medical',
        title: req.body.title || file.originalname,
        description: req.body.description || '',
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/documents/${file.filename}`,
        uploadedBy: req.user.id,
        issuedDate: req.body.issuedDate ? new Date(req.body.issuedDate) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
        issuedBy: req.body.issuedBy || '',
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
        metadata: {
          veterinarian: req.body.veterinarian || '',
          clinic: req.body.clinic || '',
          testType: req.body.testType || '',
          results: req.body.results || '',
          insuranceProvider: req.body.insuranceProvider || '',
          policyNumber: req.body.policyNumber || '',
          claimNumber: req.body.claimNumber || ''
        }
      };
      const document = await Document.create(documentData);
      await document.populate('uploadedBy', 'name email');
      uploadedDocuments.push(document);
      await AuditLog.create({
        user: req.user._id,
        action: 'document_upload',
        resource: 'document',
        resourceId: document._id.toString(),
        details: { petId, type: document.type, filename: file.originalname },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    res.status(201).json({
      success: true,
      data: uploadedDocuments
    });
  } catch (error) {
    next(error);
  }
};
const updateDocument = async (req, res, next) => {
  try {
    let document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    if (req.user.role === 'owner' && document.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this document'
      });
    }
    const allowedFields = [
      'title', 'description', 'type', 'category', 'issuedDate', 
      'expiryDate', 'issuedBy', 'tags', 'metadata', 'isPrivate'
    ];
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    document = await Document.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email');
    await AuditLog.create({
      user: req.user._id,
      action: 'document_update',
      resource: 'document',
      resourceId: req.params.id,
      details: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};
const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    if (req.user.role === 'owner' && document.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this document'
      });
    }
    document.isActive = false;
    await document.save();
    try {
      const filePath = path.join(__dirname, '../../uploads/documents', document.filename);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.log('File deletion error:', fileError.message);
    }
    await AuditLog.create({
      user: req.user._id,
      action: 'document_deletion',
      resource: 'document',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
const getUserDocuments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = { 
      owner: req.user.id, 
      isActive: true 
    };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.pet) filter.pet = req.query.pet;
    const documents = await Document.find(filter)
      .populate('pet', 'name species')
      .populate('uploadedBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await Document.countDocuments(filter);
    res.json({
      success: true,
      data: documents,
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
module.exports = {
  getPetDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getUserDocuments
};