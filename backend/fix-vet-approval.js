const mongoose = require('mongoose');
const User = require('./src/models/User');

async function fixVetApproval() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/furshield');
    console.log('Connected to MongoDB');
    
    // Find the specific vet user
    const vet = await User.findOne({ 
      email: 'bi.l.ly.reycue.va.9@gmail.com' 
    });
    
    if (vet) {
      console.log('Found vet:', vet.name);
      console.log('Current status:');
      console.log('- Role:', vet.role);
      console.log('- Email Verified:', vet.isEmailVerified);
      console.log('- Vet Verified:', vet.isVetVerified);
      console.log('- Active:', vet.isActive);
      
      // Update to make vet appear in admin approval queue
      vet.isVetVerified = false;
      vet.isEmailVerified = true; // Force email verified so they show in admin
      vet.isActive = true;
      await vet.save();
      
      console.log('\nUpdated vet to appear in admin approval queue');
      console.log('- Email Verified: true');
      console.log('- Vet Verified: false');
      console.log('- Active: true');
    } else {
      console.log('Vet not found with email: bi.l.ly.reycue.va.9@gmail.com');
    }
    
    // Check all pending vets
    const pendingVets = await User.find({
      role: 'vet',
      isVetVerified: false,
      isActive: true,
      isEmailVerified: true
    }).select('name email isVetVerified isEmailVerified');
    
    console.log(`\nPending vets for admin approval (${pendingVets.length}):`);
    pendingVets.forEach(v => {
      console.log(`- ${v.name} (${v.email})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixVetApproval();
