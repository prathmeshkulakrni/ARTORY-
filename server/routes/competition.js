const express = require('express');
const router = express.Router();
const {
  createCompetition, getAllCompetitions, getCompetitionById,
  joinCompetition, submitImage, pickWinners, approveCompetition, getSubmissions, endCompetition,
} = require('../controllers/competitionController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getAllCompetitions);
router.post('/', protect, upload.single('coverImage'), createCompetition);
router.get('/:id', protect, getCompetitionById);
router.post('/:id/join', protect, joinCompetition);
router.post('/:id/submit', protect, upload.single('submissionImage'), submitImage);
router.post('/:id/winners', protect, pickWinners);
router.get('/:id/submissions', protect, getSubmissions);
router.put('/:id/approve', protect, approveCompetition);
router.put('/:id/end', protect, endCompetition);

module.exports = router;
