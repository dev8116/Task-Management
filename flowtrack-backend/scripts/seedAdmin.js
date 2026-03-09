// Run from INSIDE the flowtrack-backend folder:
// node scripts/seedAdmin.js

require('dotenv').config();   // loads flowtrack-backend/.env
const mongoose = require('mongoose');
const User = require('../models/User');

async function seed() {
  try {
    console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Found' : '❌ MISSING - check your .env file');

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined. Make sure flowtrack-backend/.env exists with MONGO_URI=...');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Remove old admin if exists
    const deleted = await User.deleteOne({ email: 'admin@flowtrack.com' });
    if (deleted.deletedCount > 0) console.log('🗑️  Removed old plain-text admin');

    // Create fresh admin — pre('save') hook will bcrypt hash the password
    const admin = await User.create({
      name: 'FlowTrack Admin',
      email: 'admin@flowtrack.com',
      password: 'Admin@123',
      role: 'admin',
      department: 'Management',
    });

    console.log('✅ Admin created successfully with hashed password!');
    console.log('   Email:    admin@flowtrack.com');
    console.log('   Password: Admin@123');
    console.log('   _id:     ', admin._id);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();