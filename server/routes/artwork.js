const express = require('express');
const router = express.Router();
const { createArtwork, getFeed, getPublicFeed, getArtworkById, getByCategory, getByUser, likeArtwork, addComment, deleteArtwork, searchArtwork } = require('../controllers/artworkController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/public', getPublicFeed); // no auth — used on landing page
router.get('/feed', protect, getFeed);
router.get('/search', protect, searchArtwork);
router.get('/category/:cat', protect, getByCategory);
router.get('/user/:userId', protect, getByUser);
router.post('/', protect, upload.single('image'), createArtwork);
router.get('/:id', protect, getArtworkById);
router.post('/:id/like', protect, likeArtwork);
router.post('/:id/comment', protect, addComment);
router.delete('/:id', protect, deleteArtwork);

module.exports = router;
