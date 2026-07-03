const Artwork = require('../models/Artwork');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Community = require('../models/Community');
const User = require('../models/User');
const { createNotification } = require('../utils/notify');

const canViewAdultContent = (user) => user?.role === 'admin' || Number(user?.age) >= 18;
const adultFilterFor = (user) => canViewAdultContent(user) ? {} : { isAdultContent: { $ne: true } };
const isTruthy = (value) => value === true || value === 'true' || value === '1' || value === 'on';

// @POST /api/artwork
const createArtwork = async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    const isAdultContent = isTruthy(req.body.isAdultContent);
    if (!req.file) return res.status(400).json({ message: 'Image is required' });
    if (isAdultContent && !canViewAdultContent(req.user)) {
      return res.status(403).json({ message: 'Users under 18 cannot upload 18+ images' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const artwork = await Artwork.create({
      title,
      description,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      imageUrl,
      artist: req.user._id,
      isAdultContent,
    });
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

    const query = adultFilterFor(req.user);
    const artworks = await Artwork.find(query)
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit)
      .populate('artist', 'username profileImage')
      .populate({ path: 'comments', options: { limit: 3 } });

    const total = await Artwork.countDocuments(query);
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
    if (artwork.isAdultContent && !canViewAdultContent(req.user)) {
      return res.status(403).json({ message: 'You must be 18 or older to view this artwork' });
    }
    res.json(artwork);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/artwork/category/:cat
const getByCategory = async (req, res) => {
  try {
    const artworks = await Artwork.find({ category: req.params.cat, ...adultFilterFor(req.user) })
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
    const artworks = await Artwork.find({ artist: req.params.userId, ...adultFilterFor(req.user) })
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
        await createNotification(req, { recipient: artwork.artist, sender: req.user._id, type: 'like', message: `${req.user.username} liked your artwork`, link: `/artwork/${artwork._id}` });
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
      await createNotification(req, { recipient: artwork.artist, sender: req.user._id, type: 'comment', message: `${req.user.username} commented on your artwork`, link: `/artwork/${artwork._id}` });
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
    await Promise.all([
      Comment.deleteMany({ artwork: artwork._id }),
      Community.updateMany({ posts: artwork._id }, { $pull: { posts: artwork._id } }),
      Notification.deleteMany({ link: `/artwork/${artwork._id}` }),
    ]);
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
    const term = q?.trim();
    if (!term) return res.json([]);
    const matchingArtists = await User.find({ username: { $regex: term, $options: 'i' } }).select('_id');
    const artistIds = matchingArtists.map(user => user._id);
    const artworks = await Artwork.find({
      ...adultFilterFor(req.user),
      $or: [
        { title: { $regex: term, $options: 'i' } },
        { artist: { $in: artistIds } },
      ],
    })
      .populate('artist', 'username profileImage').limit(20);
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/artwork/public  (no auth required)
const getPublicFeed = async (req, res) => {
  try {
    const User = require('../models/User');

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminIds = adminUsers.map(u => u._id);

    let artworks = [];

    // First try: artworks uploaded by admins
    if (adminIds.length > 0) {
      artworks = await Artwork.find({ artist: { $in: adminIds }, isAdultContent: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('artist', 'username profileImage')
        .select('title imageUrl likes artist createdAt');
    }

    // Fallback: if no admin artworks, return most recent from anyone
    if (artworks.length === 0) {
      artworks = await Artwork.find({ isAdultContent: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('artist', 'username profileImage')
        .select('title imageUrl likes artist createdAt');
    }

    res.json({ artworks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createArtwork, getFeed, getPublicFeed, getArtworkById, getByCategory, getByUser, likeArtwork, addComment, deleteArtwork, searchArtwork };
