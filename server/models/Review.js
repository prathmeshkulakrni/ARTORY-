const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'ArtRequest', required: true },
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, required: true, trim: true, maxlength: 1200 },
}, { timestamps: true });

reviewSchema.index({ request: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
