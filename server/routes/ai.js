const express = require('express');
const router = express.Router();
const { aiMentor, getArtworkFeedback, getLearningPath, getTutorialVideos, createTutorialVideo } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/mentor', protect, aiMentor);
router.post('/feedback', protect, getArtworkFeedback);
router.get('/learning-path', protect, getLearningPath);
router.get('/tutorials', protect, getTutorialVideos);
router.post('/tutorials', protect, createTutorialVideo);

module.exports = router;
