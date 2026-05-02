const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  attachmentUrl: { type: String, default: '' },
  replyTo: {
    messageId: { type: mongoose.Schema.Types.ObjectId, default: null },
    message: { type: String, default: '' },
    senderName: { type: String, default: '' },
  },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
