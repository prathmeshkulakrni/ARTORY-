const mongoose = require('mongoose');

const comicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  genre: { type: String, default: 'general' },
  episodes: [{
    episodeNumber: { type: Number },
    title: { type: String },
    pages: [{ type: String }],
    publishedAt: { type: Date, default: Date.now },
  }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isCompleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Comic', comicSchema);
