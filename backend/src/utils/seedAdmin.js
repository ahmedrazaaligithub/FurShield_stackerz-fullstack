const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { logger } = require('./logger');
const seedAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        existingAdmin.isVerified = true;
        existingAdmin.isActive = true;
        await existingAdmin.save();
        logger.info('Updated existing user to admin role');
      }
      return existingAdmin;
    }
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const adminUser = await User.create({
      name: 'System Administrator',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      isActive: true,
      phone: '+923213265524',
      address: 'Admin Office, System, Admin, 00000, Pakistan'
    });
    logger.info('Admin user created successfully');
    return adminUser;
  } catch (error) {
    logger.error('Error seeding admin user:', error);
    throw error;
  }
};
module.exports = { seedAdminUser };