const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  aadhaarImage: { type: String, required: true },
  passportPhoto: { type: String, required: true },
  certificateImage: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
