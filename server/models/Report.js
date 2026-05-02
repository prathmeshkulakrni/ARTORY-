const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: {
    type: String,
    enum: ['artwork', 'community', 'comic', 'user', 'competition'],
    required: true
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: {
    type: String,
    enum: ['fake-user', 'ownership', 'illegal', 'other'],
    required: true
  },
  details: { type: String, maxlength: 100, default: '' },
  status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
