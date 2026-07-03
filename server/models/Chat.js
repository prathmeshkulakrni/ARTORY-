const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, trim: true, default: '' },
  attachments: [{
    url: { type: String, required: true },
    originalName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
  }],
  kind: { type: String, enum: ['message', 'final_submission'], default: 'message' },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const chatSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'ArtRequest', required: true, index: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  messages: [chatMessageSchema],
}, { timestamps: true });

chatSchema.index({ requester: 1, artist: 1, updatedAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
