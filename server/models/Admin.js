const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  securityLevel: {
    type: String,
    enum: ['super', 'moderator', 'support'],
    default: 'moderator'
  },
  departments: [{
    type: String,
    default: []
  }],
  permissions: [{
    type: String,
    default: []
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
