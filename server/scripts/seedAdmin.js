require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@artory.com';
const ADMIN_PASSWORD = 'Admin@123';

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const existingAdmin = await User.findOne({
      $or: [{ email: ADMIN_EMAIL }, { username: ADMIN_USERNAME }]
    });

    if (existingAdmin) {
      existingAdmin.username = ADMIN_USERNAME;
      existingAdmin.email = ADMIN_EMAIL;
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log(`Admin account updated: ${ADMIN_EMAIL}`);
    } else {
      await User.create({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin'
      });
      console.log(`Admin account created: ${ADMIN_EMAIL}`);
    }

    console.log(`Password: ${ADMIN_PASSWORD}`);
  } catch (error) {
    console.error(`Failed to seed admin: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
