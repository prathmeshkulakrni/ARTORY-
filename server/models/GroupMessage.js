const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  replyTo: {
    messageId: { type: mongoose.Schema.Types.ObjectId, default: null },
    message: { type: String, default: '' },
    senderName: { type: String, default: '' },
  },
}, { timestamps: true });

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
