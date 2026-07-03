const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'ArtRequest', required: true, index: true },
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true, trim: true, maxlength: 2500 },
  portfolioLinks: [{ type: String, trim: true }],
  sampleFiles: [{ type: String }],
  status: { type: String, enum: ['Open', 'Accepted', 'Closed'], default: 'Open', index: true },
}, { timestamps: true });

applicationSchema.index({ request: 1, artist: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
