const express = require('express');
const router = express.Router();
const { followUser, getSuggestions, getNotifications, markNotificationsRead } = require('../controllers/socialController');
const { protect } = require('../middleware/auth');

router.post('/follow/:id', protect, followUser);
router.get('/suggestions', protect, getSuggestions);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);

module.exports = router;
