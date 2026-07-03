const mongoose = require('mongoose');

const artRequestSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  acceptedArtist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  acceptedApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 4000 },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ['Sketching', 'Digital Art', 'Painting', 'Anime Art', 'Logo Design', 'Portrait', 'Calligraphy', 'Comics', 'Other'],
  },
  budget: {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
  },
  deadline: { type: Date, required: true },
  referenceImages: [{ type: String }],
  status: { type: String, enum: ['Open', 'Pending', 'Done', 'Closed'], default: 'Open', index: true },
}, { timestamps: true });

artRequestSchema.index({ category: 1, status: 1, createdAt: -1 });
artRequestSchema.index({ 'budget.min': 1, 'budget.max': 1 });

module.exports = mongoose.model('ArtRequest', artRequestSchema);
