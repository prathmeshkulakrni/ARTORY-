const mongoose = require('mongoose');

const communityMessageSchema = new mongoose.Schema({
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  replyTo: {
    messageId: { type: mongoose.Schema.Types.ObjectId, default: null },
    message: { type: String, default: '' },
    senderName: { type: String, default: '' },
  },
}, { timestamps: true });

module.exports = mongoose.model('CommunityMessage', communityMessageSchema);
