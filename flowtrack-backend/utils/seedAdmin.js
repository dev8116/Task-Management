const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_SEED_EMAIL;
    const adminPassword = process.env.ADMIN_SEED_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log("Admin seeding skipped: ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD not set");
      return;
    }

    const normalizedEmail = String(adminEmail).trim().toLowerCase();
    const adminExists = await User.findOne({ email: normalizedEmail });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(String(adminPassword), 12);
      await User.create({
        name: process.env.ADMIN_SEED_NAME || "Admin",
        email: normalizedEmail,
        password: hashedPassword,
        role: "admin",
        department: process.env.ADMIN_SEED_DEPARTMENT || "Administration",
        phone: process.env.ADMIN_SEED_PHONE || "",
        isActive: true,
      });
      console.log("Admin account created from seed configuration");
    } else {
      console.log("Admin account already exists");
    }
  } catch (error) {
    console.error("Error seeding admin:", error.message);
  }
};

module.exports = seedAdmin;