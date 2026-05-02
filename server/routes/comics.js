const express = require('express');
const router = express.Router();
const { createComic, getAllComics, getComicById, likeComic } = require('../controllers/comicsController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getAllComics);
router.post('/', protect, upload.single('coverImage'), createComic);
router.get('/:id', protect, getComicById);
router.post('/:id/like', protect, likeComic);

module.exports = router;
