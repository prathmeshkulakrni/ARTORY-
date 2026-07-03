const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: [
      'like',
      'comment',
      'follow',
      'competition',
      'community',
      'mention',
      'system',
      'marketplace_application',
      'marketplace_accepted',
      'marketplace_message',
      'marketplace_completed',
      'marketplace_feedback',
    ],
    required: true
  },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
