const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  age: { type: Number, min: 1, max: 120, default: null },
  bio: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  skills: [{ type: String }],
  artInterests: [{ type: String }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'mentor', 'admin'], default: 'user' },
  socialLinks: {
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    website: { type: String, default: '' },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
