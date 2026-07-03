const Mentor = require('../models/Mentor');
const UserInterest = require('../models/UserInterest');
// ─── In-memory cache (5-minute TTL) ─────────────────────────────────────────
const mentorCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = mentorCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { mentorCache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data) {
  mentorCache.set(key, { data, ts: Date.now() });
}

// ─── Ultra-lean catalog — keeps token count low ──────────────────────────────
function buildCatalog(mentors) {
  return mentors.map((m) => ({
    n: m.name,                                    // name
    t: (m.tags || []).slice(0, 6).join(', '),     // top 6 tags
    c: (m.teachingCategories || []).join(', '),   // categories
    s: (m.skills || []).slice(0, 3).join(', '),   // top 3 skills
    r: m.rating,
  }));
}

// ─── Robust JSON extractor — tries 3 strategies ──────────────────────────────
function extractJSON(raw) {
  // Strategy 1: direct parse after stripping fences
  try {
    const s1 = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(s1);
  } catch (_) {}

  // Strategy 2: find first '[' ... last ']'
  try {
    const start = raw.indexOf('[');
    const end   = raw.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
  } catch (_) {}

  // Strategy 3: extract all individual {...} objects
  try {
    const objects = [];
    const regex = /\{[^{}]+\}/g;
    let match;
    while ((match = regex.exec(raw)) !== null) {
      try { objects.push(JSON.parse(match[0])); } catch (_) {}
    }
    if (objects.length > 0) return objects;
  } catch (_) {}

  throw new Error(`Could not parse Gemini response as JSON. Raw: ${raw.slice(0, 120)}`);
}

// ─── Algorithmic recommendation engine ─────────────────────────────────────────
async function runAIRecommendation(query, userInterests, mentorCatalog) {
  const normalize = (str) => (str || '').toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 2);
  const queryWords = new Set([...normalize(query), ...(userInterests || []).flatMap(i => normalize(i))]);
  
  const scoredMentors = mentorCatalog.map(mentor => {
    let score = 0;
    const matchedCategories = [];
    const matchedTags = [];
    const matchedSkills = [];

    // Check categories (highest weight)
    if (mentor.c) {
      const categories = mentor.c.toLowerCase().split(',').map(s => s.trim());
      categories.forEach(cat => {
        if (Array.from(queryWords).some(word => cat.includes(word))) {
          score += 15;
          matchedCategories.push(cat);
        }
      });
    }

    // Check tags (medium weight)
    if (mentor.t) {
      const tags = mentor.t.toLowerCase().split(',').map(s => s.trim());
      tags.forEach(tag => {
        if (Array.from(queryWords).some(word => tag.includes(word))) {
          score += 10;
          matchedTags.push(tag);
        }
      });
    }

    // Check skills (low weight)
    if (mentor.s) {
      const skills = mentor.s.toLowerCase().split(',').map(s => s.trim());
      skills.forEach(skill => {
        if (Array.from(queryWords).some(word => skill.includes(word))) {
          score += 5;
          matchedSkills.push(skill);
        }
      });
    }

    // Base score for rating
    score += (mentor.r || 4.0);

    let matchReason = "A great overall mentor for your art journey.";
    if (matchedCategories.length > 0) {
      matchReason = `Specializes in ${matchedCategories.slice(0, 2).join(' and ')}, matching your interests perfectly.`;
    } else if (matchedTags.length > 0 || matchedSkills.length > 0) {
      const allMatches = [...matchedTags, ...matchedSkills];
      matchReason = `Has skills in ${allMatches.slice(0, 2).join(' and ')} that align with your goals.`;
    }

    const matchPercentage = score > 4 ? Math.min(99, Math.round(50 + (score * 1.5))) : Math.round(30 + score);

    return {
      mentorName: mentor.n,
      matchReason,
      matchPercentage,
      score
    };
  });

  scoredMentors.sort((a, b) => b.score - a.score);
  return scoredMentors.slice(0, 5);
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/mentors
// ────────────────────────────────────────────────────────────────────────────
const getMentors = async (req, res) => {
  try {
    const { page = 1, limit = 12, tag, skill, category } = req.query;
    const cacheKey = `mentors:${page}:${limit}:${tag}:${skill}:${category}`;

    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const filter = { isAvailable: true };
    if (tag) filter.tags = { $in: [tag.toLowerCase()] };
    if (skill) filter.skills = { $regex: skill, $options: 'i' };
    if (category) filter.teachingCategories = { $regex: category, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [mentors, total] = await Promise.all([
      Mentor.find(filter)
        .sort({ rating: -1, reviewCount: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Mentor.countDocuments(filter),
    ]);

    const payload = {
      mentors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };

    setCache(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    console.error('getMentors error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/mentors
// ────────────────────────────────────────────────────────────────────────────
const createMentor = async (req, res) => {
  try {
    const { name, bio, profileImage, tags, skills, teachingCategories, experience, rating, socialLinks, price } = req.body;

    if (!name) return res.status(400).json({ message: 'Mentor name is required' });

    const mentor = await Mentor.create({
      userId: req.user._id,
      name,
      bio,
      profileImage,
      tags: Array.isArray(tags) ? tags.map((t) => t.toLowerCase()) : [],
      skills: Array.isArray(skills) ? skills : [],
      teachingCategories: Array.isArray(teachingCategories) ? teachingCategories : [],
      experience: experience || 0,
      rating: rating || 4.0,
      socialLinks: socialLinks || {},
      price: price || 0,
    });

    // Bust cache
    mentorCache.clear();

    res.status(201).json(mentor);
  } catch (err) {
    console.error('createMentor error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/mentors/:id/follow
// ────────────────────────────────────────────────────────────────────────────
const followMentor = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

    const userId = req.user._id;
    const isFollowing = mentor.followers.some((f) => f.toString() === userId.toString());

    if (isFollowing) {
      mentor.followers = mentor.followers.filter((f) => f.toString() !== userId.toString());
    } else {
      mentor.followers.push(userId);
    }

    await mentor.save();
    mentorCache.clear();

    res.json({ following: !isFollowing, followerCount: mentor.followers.length });
  } catch (err) {
    console.error('followMentor error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/ai/recommend-mentors
// ────────────────────────────────────────────────────────────────────────────
const recommendMentors = async (req, res) => {
  try {
    const { query, userInterests = [] } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // Fetch lightweight mentor catalog (all available mentors)
    const allMentors = await Mentor.find({ isAvailable: true })
      .select('name bio tags skills teachingCategories rating experience')
      .lean();

    if (allMentors.length === 0) {
      return res.json({ recommendations: [], message: 'No mentors available yet.' });
    }

    // Fetch user's stored interests to enrich the context
    const interestDoc = await UserInterest.findOne({ userId: req.user._id });
    const combinedInterests = [
      ...new Set([
        ...userInterests,
        ...(interestDoc?.interests || []),
        ...(interestDoc?.favoriteTags || []),
      ]),
    ];

    // Save this query to search history (keep last 20)
    await UserInterest.findOneAndUpdate(
      { userId: req.user._id },
      {
        $push: {
          searchHistory: {
            $each: [{ query: query.trim(), timestamp: new Date() }],
            $slice: -20,
          },
        },
        $setOnInsert: { interests: [], favoriteTags: [], learningGoals: [] },
      },
      { upsert: true, new: true }
    );

    // Build catalog and call Gemini
    const catalog = buildCatalog(allMentors);
    const aiResults = await runAIRecommendation(query.trim(), combinedInterests, catalog);

    // Merge AI results with full mentor documents
    const mentorMap = {};
    allMentors.forEach((m) => { mentorMap[m.name] = m; });

    // Fetch full mentor docs for matched names to include followers count etc.
    const matchedNames = aiResults.map((r) => r.mentorName);
    const fullMentors = await Mentor.find({ name: { $in: matchedNames } })
      .select('-__v')
      .lean();
    const fullMentorMap = {};
    fullMentors.forEach((m) => { fullMentorMap[m.name] = m; });

    const recommendations = aiResults
      .map((result) => ({
        mentorName: result.mentorName,
        matchReason: result.matchReason,
        matchPercentage: Math.min(100, Math.max(0, parseInt(result.matchPercentage) || 0)),
        mentor: fullMentorMap[result.mentorName] || mentorMap[result.mentorName] || null,
      }))
      .filter((r) => r.mentor !== null)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json({ recommendations, query });
  } catch (err) {
    console.error('recommendMentors error:', err);
    res.status(500).json({ message: err.message || 'AI recommendation failed' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/ai/user-interests
// ────────────────────────────────────────────────────────────────────────────
const getUserInterests = async (req, res) => {
  try {
    const doc = await UserInterest.findOne({ userId: req.user._id });
    res.json(doc || { interests: [], favoriteTags: [], learningGoals: [], searchHistory: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/ai/user-interests
// ────────────────────────────────────────────────────────────────────────────
const updateUserInterests = async (req, res) => {
  try {
    const { interests, favoriteTags, learningGoals } = req.body;

    const doc = await UserInterest.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          ...(interests && { interests }),
          ...(favoriteTags && { favoriteTags: favoriteTags.map((t) => t.toLowerCase()) }),
          ...(learningGoals && { learningGoals }),
        },
        $setOnInsert: { searchHistory: [] },
      },
      { upsert: true, new: true }
    );

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getMentors,
  createMentor,
  followMentor,
  recommendMentors,
  getUserInterests,
  updateUserInterests,
  runAIRecommendation,
  buildCatalog,
};
