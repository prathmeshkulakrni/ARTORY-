require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const result = await User.updateMany(
    { $or: [{ age: { $exists: false } }, { age: null }] },
    { $set: { age: 18 } }
  );

  console.log(`Set age to 18 for ${result.modifiedCount || 0} existing users`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
