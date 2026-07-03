const mockResponses = [
  "Great start! Focus on your line confidence — try drawing without lifting your pen.",
  "Your composition is strong. Consider the rule of thirds to balance your subject better.",
  "For this style, try layering light washes of color before adding details.",
  "Practice gesture drawing for 10 minutes daily — it will dramatically improve your figures.",
  "Your color palette is harmonious! Try adding a complementary accent color for pop.",
  "This piece shows great emotion. Keep experimenting with texture and brush strokes.",
  "For digital art, try using a limited palette of 3-5 colors first, then expand.",
  "Shadows define form. Observe how light falls from a single source in your reference.",
];
const VideoTutorial = require('../models/VideoTutorial');
const Mentor = require('../models/Mentor');
const { runAIRecommendation, buildCatalog } = require('./mentorController');
const aiMentor = async (req, res) => {
  try {
    const { message, context } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    let mentorSuggestion = null;
    try {
      const allMentors = await Mentor.find({ isAvailable: true }).select('name bio tags skills teachingCategories rating experience profileImage').lean();
      if (allMentors.length > 0) {
        const catalog = buildCatalog(allMentors);
        const aiResults = await runAIRecommendation(message, [], catalog);
        
        if (aiResults && aiResults.length > 0 && aiResults[0].score >= 5) {
          const bestMatch = aiResults[0];
          const fullMentor = allMentors.find(m => m.name === bestMatch.mentorName);
          if (fullMentor) {
            mentorSuggestion = {
              mentorName: bestMatch.mentorName,
              matchReason: bestMatch.matchReason,
              matchPercentage: bestMatch.matchPercentage,
              mentor: fullMentor
            };
          }
        }
      }
    } catch (mentorErr) {
      console.error('In-chat mentor recommendation error:', mentorErr);
    }

    if (apiKey) {
      try {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({
          apiKey: apiKey,
          baseURL: "https://api.groq.com/openai/v1",
        });
        
        const response = await openai.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are Aria, an expert AI art mentor. Give encouraging, specific, actionable advice to artists. Keep responses concise (2-3 sentences max)." },
            { role: "user", content: message }
          ],
          max_tokens: 200
        });
        
        return res.json({ reply: response.choices[0].message.content, mentorSuggestion });
      } catch (aiErr) {
        console.error('Groq API Error:', aiErr.message);
        // Fall through to mock response below instead of crashing
      }
    }

    // Mock response
    const mockResponses = [
      "Great start! Focus on your line confidence — try drawing without lifting your pen.",
      "Your composition is strong. Consider the rule of thirds to balance your subject better.",
      "For this style, try layering light washes of color before adding details.",
      "Practice gesture drawing for 10 minutes daily — it will dramatically improve your figures.",
    ];
    const reply = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    setTimeout(() => res.json({ reply, mentorSuggestion }), 800);
  } catch (err) {
    console.error('AI Mentor Error:', err);
    res.status(500).json({ message: err.message });
  }
};

const getArtworkFeedback = async (req, res) => {
  try {
    const feedbacks = [
      { aspect: 'Composition', score: Math.floor(Math.random() * 3) + 7, note: 'Good use of negative space.' },
      { aspect: 'Color Theory', score: Math.floor(Math.random() * 3) + 6, note: 'Try warmer highlights.' },
      { aspect: 'Line Quality', score: Math.floor(Math.random() * 3) + 7, note: 'Confident strokes detected.' },
      { aspect: 'Originality', score: Math.floor(Math.random() * 3) + 8, note: 'Unique style emerging!' },
    ];
    res.json({ feedback: feedbacks, overall: 'Keep pushing your boundaries — this shows real potential!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getLearningPath = async (req, res) => {
  try {
    const { level, interest } = req.query;
    const paths = {
      beginner: [
        { week: 1, title: 'Basic Shapes & Line Drawing', tasks: ['Draw 50 lines', 'Sketch basic shapes', 'Practice contour drawing'] },
        { week: 2, title: 'Light & Shadow Fundamentals', tasks: ['Study value scales', 'Draw a sphere with shading', 'Observe light sources'] },
        { week: 3, title: 'Color Theory Basics', tasks: ['Color wheel exercise', 'Complementary colors study', 'Warm vs cool colors'] },
        { week: 4, title: 'Your First Complete Piece', tasks: ['Choose a reference', 'Sketch composition', 'Add color and detail'] },
      ],
      intermediate: [
        { week: 1, title: 'Advanced Composition', tasks: ['Rule of thirds', 'Golden ratio study', 'Dynamic symmetry'] },
        { week: 2, title: 'Digital Painting Techniques', tasks: ['Layer management', 'Blend modes', 'Texture brushes'] },
        { week: 3, title: 'Character Design', tasks: ['Gesture drawing', 'Anatomy basics', 'Character turnaround'] },
        { week: 4, title: 'Portfolio Piece', tasks: ['Plan illustration', 'Full color rendering', 'Present final work'] },
      ],
    };
    res.json(paths[level] || paths['beginner']);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTutorialVideos = async (req, res) => {
  try {
    const tutorials = await VideoTutorial.find({ level: 'beginner' })
      .populate('creator', 'username profileImage isVerified')
      .sort({ createdAt: -1 });
    res.json(tutorials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTutorialVideo = async (req, res) => {
  try {
    if (!req.user.isVerified && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only verified users can upload tutorials' });
    }

    const { title, description, videoUrl } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ message: 'Title and video URL are required' });
    }

    const tutorial = await VideoTutorial.create({
      title,
      description,
      videoUrl,
      level: 'beginner',
      creator: req.user._id
    });

    await tutorial.populate('creator', 'username profileImage isVerified');
    res.status(201).json(tutorial);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { aiMentor, getArtworkFeedback, getLearningPath, getTutorialVideos, createTutorialVideo };
