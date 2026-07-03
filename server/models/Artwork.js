const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  videoUrl: { type: String, default: '' },
  category: {
    type: String,
    enum: ['painting', 'digital', 'sketch', 'calligraphy', 'sculpture', 'photography', 'comic', 'other'],
    default: 'other'
  },
  tags: [{ type: String }],
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  views: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isAdultContent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Artwork', artworkSchema);
