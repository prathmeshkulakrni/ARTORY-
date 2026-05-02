const Comic = require('../models/Comic');

const createComic = async (req, res) => {
  try {
    const { title, description, genre } = req.body;
    const coverImage = req.file ? `/uploads/${req.file.filename}` : '';
    const comic = await Comic.create({ title, description, genre, coverImage, creator: req.user._id });
    res.status(201).json(comic);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getAllComics = async (req, res) => {
  try {
    const comics = await Comic.find().sort({ createdAt: -1 }).populate('creator', 'username profileImage');
    res.json(comics);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getComicById = async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id).populate('creator', 'username profileImage');
    if (!comic) return res.status(404).json({ message: 'Not found' });
    res.json(comic);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const likeComic = async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id);
    if (!comic) return res.status(404).json({ message: 'Not found' });
    const liked = comic.likes.includes(req.user._id);
    if (liked) comic.likes.pull(req.user._id);
    else comic.likes.push(req.user._id);
    await comic.save();
    res.json({ likes: comic.likes.length, liked: !liked });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { createComic, getAllComics, getComicById, likeComic };
