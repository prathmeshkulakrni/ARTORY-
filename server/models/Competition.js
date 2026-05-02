const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  coverImage: { type: String, default: '' },
  category: { type: String, default: 'open' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deadline: { type: Date, required: true },
  prize: { type: String, default: '' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Each submission: user + uploaded image path
  submissions: [{
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    imageUrl: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
  }],
  // Top 3 winners chosen by organizer: [{rank:1, artist, imageUrl}]
  winners: [{
    rank: { type: Number },
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    imageUrl: { type: String },
  }],
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Competition', competitionSchema);
