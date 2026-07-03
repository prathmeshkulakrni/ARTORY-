const express = require('express');
const router = express.Router();
const { aiMentor, getArtworkFeedback, getLearningPath, getTutorialVideos, createTutorialVideo } = require('../controllers/aiController');
const { recommendMentors, getUserInterests, updateUserInterests } = require('../controllers/mentorController');
const { protect } = require('../middleware/auth');

// Existing AI routes
router.post('/mentor', protect, aiMentor);
router.post('/feedback', protect, getArtworkFeedback);
router.get('/learning-path', protect, getLearningPath);
router.get('/tutorials', protect, getTutorialVideos);
router.post('/tutorials', protect, createTutorialVideo);

// AI Mentor Recommendation routes
router.post('/recommend-mentors', protect, recommendMentors);
router.get('/user-interests', protect, getUserInterests);
router.post('/user-interests', protect, updateUserInterests);

module.exports = router;
