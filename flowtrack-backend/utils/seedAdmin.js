const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@flowtrack.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin@123', 12);
      await User.create({
        name: 'Super Admin',
        email: 'admin@flowtrack.com',
        password: hashedPassword,
        role: 'admin',
        department: 'Administration',
        phone: '0000000000',
        isActive: true,
      });
      console.log('Default admin account created: admin@flowtrack.com / Admin@123');
    } else {
      console.log('Admin account already exists');
    }
  } catch (error) {
    console.error('Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;