const mongoose = require('mongoose');

const userInterestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    interests: [{ type: String, trim: true }],
    favoriteTags: [{ type: String, lowercase: true, trim: true }],
    learningGoals: [{ type: String, trim: true }],

    // Rolling history of last 20 AI recommendation queries
    searchHistory: [
      {
        query: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserInterest', userInterestSchema);
