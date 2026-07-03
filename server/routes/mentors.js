const express = require('express');
const router = express.Router();
const { getMentors, createMentor, followMentor } = require('../controllers/mentorController');
const { protect } = require('../middleware/auth');

// GET  /api/mentors           — paginated mentor listing with optional filters
router.get('/', protect, getMentors);

// POST /api/mentors           — create a new mentor profile
router.post('/', protect, createMentor);

// POST /api/mentors/:id/follow — toggle follow/unfollow a mentor
router.post('/:id/follow', protect, followMentor);

module.exports = router;
