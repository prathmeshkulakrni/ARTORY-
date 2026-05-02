const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const artHistoryController = require('../controllers/artHistoryController');
const upload = require('../middleware/upload');

router.get('/', artHistoryController.getPosts);
router.post('/', protect, upload.single('image'), artHistoryController.createPost);

module.exports = router;
