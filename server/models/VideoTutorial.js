const mongoose = require('mongoose');

const videoTutorialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, required: true, trim: true },
  level: { type: String, enum: ['beginner'], default: 'beginner' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('VideoTutorial', videoTutorialSchema);
