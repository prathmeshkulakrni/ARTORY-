const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, getUserById, searchUsers } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);
router.get('/user/:id', protect, getUserById);
router.get('/search', protect, searchUsers);

module.exports = router;
