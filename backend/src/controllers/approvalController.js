const User = require('../models/User');
const Shelter = require('../models/Shelter');
const AuditLog = require('../models/AuditLog');
const { emitToAdmins } = require('../sockets/socketHandler');
const { sendEmail } = require('../services/emailService');
const getPendingApprovals = async (req, res, next) => {
  try {
    console.log('Fetching pending approvals...');
    const pendingShelters = await Shelter.find({ 
      isVerified: false, 
      isActive: true 
    }).sort({ createdAt: -1 });
    console.log(`Found ${pendingShelters.length} pending shelters`);
    let pendingVets = [];
    try {
      pendingVets = await User.find({ 
        role: 'vet', 
        $or: [
          { isVetVerified: false },
          { isEmailVerified: false }
        ],
        isActive: true
      }).select('-password').sort({ createdAt: -1 });
      console.log(`Found ${pendingVets.length} pending vets from database`);
      console.log('Pending vets:', pendingVets.map(v => ({ 
        name: v.name, 
        email: v.email, 
        isEmailVerified: v.isEmailVerified, 
        isVetVerified: v.isVetVerified 
      })));
    } catch (dbError) {
      console.log('Database error for vets:', dbError.message);
    }
    const mockVets = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Dr. Arhum Khan',
        email: 'bi.l.ly.reycue.va.9@gmail.com',
        role: 'vet',
        phone: '+92030211223',
        address: 'House # A-123, Block 5, Gulshan-e-Iqbal, Karachi, 75300',
        isVetVerified: false,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        profile: {
          bio: 'Experienced veterinarian specializing in small animals',
          specialization: 'Small Animals',
          experience: 5,
          licenseNumber: 'VET12345',
          location: 'Karachi Veterinary Clinic'
        }
      },
      {
        _id: '507f1f77bcf86cd799439012',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.vet@example.com',
        role: 'vet',
        phone: '+1234567890',
        address: '123 Vet Street, City, State',
        isVetVerified: false,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        profile: {
          bio: 'Caring veterinarian with focus on preventive care',
          specialization: 'General Practice',
          experience: 8,
          licenseNumber: 'VET67890',
          location: 'Downtown Animal Hospital'
        }
      }
    ];
    pendingVets = [...pendingVets, ...mockVets];
    const mockShelters = [
      {
        _id: '507f1f77bcf86cd799439013',
        name: 'Happy Paws Shelter',
        email: 'contact@happypaws.org',
        phone: '+1-555-0123',
        address: {
          street: '123 Animal Lane',
          city: 'Pet City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        description: 'A loving shelter dedicated to finding homes for abandoned pets.',
        capacity: 50,
        established: '2015',
        license: 'SH-2015-001',
        isVerified: false,
        isActive: true,
        documents: ['license.pdf', 'insurance.pdf'],
        createdAt: new Date()
      }
    ];
    const allShelters = [...pendingShelters, ...mockShelters];
    console.log(`Found ${pendingVets.length} pending vets for approval`);
    console.log(`Found ${allShelters.length} total shelters for approval`);
    console.log('Final response data:');
    console.log('Shelters:', allShelters.map(s => ({ name: s.name, email: s.email, isVerified: s.isVerified })));
    console.log('Vets:', pendingVets.map(v => ({ name: v.name, email: v.email, isVetVerified: v.isVetVerified })));
    res.json({
      success: true,
      data: {
        shelters: allShelters,
        vets: pendingVets
      }
    });
  } catch (error) {
    next(error);
  }
};
const approveShelter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const shelter = await Shelter.findById(id);
    if (!shelter) {
      return res.status(404).json({
        success: false,
        error: 'Shelter not found'
      });
    }
    if (shelter.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Shelter is already verified'
      });
    }
    shelter.isVerified = true;
    shelter.verifiedAt = new Date();
    shelter.verifiedBy = req.user._id;
    if (notes) shelter.approvalNotes = notes;
    await shelter.save();
    if (shelter.email) {
      await sendEmail({
        email: shelter.email,
        subject: 'Shelter Application Approved - FurShield',
        message: `Congratulations! Your shelter "${shelter.name}" has been approved and verified on FurShield. You can now start managing adoption listings and connecting with pet owners.`
      });
    }
    await AuditLog.create({
      user: req.user._id,
      action: 'shelter_approval',
      resource: 'shelter',
      resourceId: shelter._id.toString(),
      details: { shelterName: shelter.name, notes },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    if (global.io) {
      emitToAdmins(global.io, 'shelter_approved', {
        shelter: shelter.name,
        approvedBy: req.user.name
      });
    }
    res.json({
      success: true,
      message: 'Shelter approved successfully',
      data: shelter
    });
  } catch (error) {
    next(error);
  }
};
const rejectShelter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const shelter = await Shelter.findById(id);
    if (!shelter) {
      return res.status(404).json({
        success: false,
        error: 'Shelter not found'
      });
    }
    if (shelter.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Cannot reject an already verified shelter'
      });
    }
    shelter.isActive = false;
    shelter.rejectedAt = new Date();
    shelter.rejectedBy = req.user._id;
    shelter.rejectionReason = reason;
    await shelter.save();
    if (shelter.email) {
      await sendEmail({
        email: shelter.email,
        subject: 'Shelter Application Status - FurShield',
        message: `We regret to inform you that your shelter application for "${shelter.name}" has been rejected. Reason: ${reason}. You may reapply after addressing the mentioned concerns.`
      });
    }
    await AuditLog.create({
      user: req.user._id,
      action: 'shelter_rejection',
      resource: 'shelter',
      resourceId: shelter._id.toString(),
      details: { shelterName: shelter.name, reason },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Shelter rejected successfully'
    });
  } catch (error) {
    next(error);
  }
};
const approveVet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const vet = await User.findById(id);
    if (!vet) {
      return res.status(404).json({
        success: false,
        error: 'Veterinarian not found'
      });
    }
    if (vet.role !== 'vet') {
      return res.status(400).json({
        success: false,
        error: 'User is not a veterinarian'
      });
    }
    if (vet.isVetVerified) {
      return res.status(400).json({
        success: false,
        error: 'Veterinarian is already verified'
      });
    }
    vet.isVetVerified = true;
    vet.verifiedAt = new Date();
    vet.verifiedBy = req.user._id;
    if (notes) vet.approvalNotes = notes;
    await vet.save();
    const { sendVetApprovalEmail } = require('../services/emailService');
    await sendVetApprovalEmail(vet);
    await AuditLog.create({
      user: req.user._id,
      action: 'vet_approval',
      resource: 'user',
      resourceId: vet._id.toString(),
      details: { vetName: vet.name, notes },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    if (global.io) {
      emitToAdmins(global.io, 'vet_approved', {
        vet: vet.name,
        approvedBy: req.user.name
      });
    }
    res.json({
      success: true,
      message: 'Veterinarian approved successfully',
      data: {
        id: vet._id,
        name: vet.name,
        email: vet.email,
        isVerified: vet.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};
const rejectVet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const vet = await User.findById(id);
    if (!vet) {
      return res.status(404).json({
        success: false,
        error: 'Veterinarian not found'
      });
    }
    if (vet.role !== 'vet') {
      return res.status(400).json({
        success: false,
        error: 'User is not a veterinarian'
      });
    }
    if (vet.isVetVerified) {
      return res.status(400).json({
        success: false,
        error: 'Cannot reject an already verified veterinarian'
      });
    }
    vet.isActive = false;
    vet.rejectedAt = new Date();
    vet.rejectedBy = req.user._id;
    vet.rejectionReason = reason;
    await vet.save();
    const { sendVetRejectionEmail } = require('../services/emailService');
    await sendVetRejectionEmail(vet, reason);
    await AuditLog.create({
      user: req.user._id,
      action: 'vet_rejection',
      resource: 'user',
      resourceId: vet._id.toString(),
      details: { vetName: vet.name, reason },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      success: true,
      message: 'Veterinarian rejected successfully'
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getPendingApprovals,
  approveShelter,
  rejectShelter,
  approveVet,
  rejectVet
};