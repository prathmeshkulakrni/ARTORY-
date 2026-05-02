const Artwork = require('../models/Artwork');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// @POST /api/artwork
const createArtwork = async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const artwork = await Artwork.create({ title, description, category, tags: tags ? tags.split(',') : [], imageUrl, artist: req.user._id });
    await artwork.populate('artist', 'username profileImage');
    res.status(201).json(artwork);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/artwork/feed
const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const artworks = await Artwork.find()
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit)
      .populate('artist', 'username profileImage')
      .populate({ path: 'comments', options: { limit: 3 } });

    const total = await Artwork.countDocuments();
    res.json({ artworks, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/artwork/:id
const getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })
      .populate('artist', 'username profileImage bio followers')
      .populate({ path: 'comments', populate: { path: 'author', select: 'username profileImage' } });
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });
    res.json(artwork);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/artwork/category/:cat
const getByCategory = async (req, res) => {
  try {
    const artworks = await Artwork.find({ category: req.params.cat })
      .sort({ createdAt: -1 }).limit(20)
      .populate('artist', 'username profileImage');
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/artwork/user/:userId
const getByUser = async (req, res) => {
  try {
    const artworks = await Artwork.find({ artist: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('artist', 'username profileImage');
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/artwork/:id/like
const likeArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: 'Not found' });

    const liked = artwork.likes.includes(req.user._id);
    if (liked) artwork.likes.pull(req.user._id);
    else {
      artwork.likes.push(req.user._id);
      if (artwork.artist.toString() !== req.user._id.toString()) {
        await Notification.create({ recipient: artwork.artist, sender: req.user._id, type: 'like', message: `${req.user.username} liked your artwork`, link: `/artwork/${artwork._id}` });
      }
    }
    await artwork.save();
    res.json({ likes: artwork.likes.length, liked: !liked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/artwork/:id/comment
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: 'Not found' });

    const comment = await Comment.create({ author: req.user._id, artwork: req.params.id, content });
    artwork.comments.push(comment._id);
    await artwork.save();
    await comment.populate('author', 'username profileImage');

    if (artwork.artist.toString() !== req.user._id.toString()) {
      await Notification.create({ recipient: artwork.artist, sender: req.user._id, type: 'comment', message: `${req.user.username} commented on your artwork`, link: `/artwork/${artwork._id}` });
    }
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/artwork/:id
const deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: 'Not found' });
    if (artwork.artist.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    await artwork.deleteOne();
    res.json({ message: 'Artwork deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/artwork/search
const searchArtwork = async (req, res) => {
  try {
    const { q } = req.query;
    const artworks = await Artwork.find({ $or: [{ title: { $regex: q, $options: 'i' } }, { tags: { $regex: q, $options: 'i' } }] })
      .populate('artist', 'username profileImage').limit(20);
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createArtwork, getFeed, getArtworkById, getByCategory, getByUser, likeArtwork, addComment, deleteArtwork, searchArtwork };
