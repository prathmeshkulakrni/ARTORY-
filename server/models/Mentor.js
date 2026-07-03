const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema(
  {
    // Optional link to an existing User account
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    name: { type: String, required: true, trim: true },
    bio: { type: String, default: '' },
    profileImage: { type: String, default: '' },

    // Semantic search & AI matching
    tags: [{ type: String, lowercase: true, trim: true }],
    skills: [{ type: String, trim: true }],
    teachingCategories: [{ type: String, trim: true }],

    experience: { type: Number, default: 0, min: 0 }, // years
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    price: { type: Number, default: 0 }, // 0 = free
    isAvailable: { type: Boolean, default: true },

    socialLinks: {
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      website: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Future: vector embedding for Pinecone / pgvector hybrid search
    // embedding: [{ type: Number }],
  },
  { timestamps: true }
);

// Indexes for fast tag/skill-based filtering
mentorSchema.index({ tags: 1 });
mentorSchema.index({ skills: 1 });
mentorSchema.index({ rating: -1 });
mentorSchema.index({ teachingCategories: 1 });

module.exports = mongoose.model('Mentor', mentorSchema);
