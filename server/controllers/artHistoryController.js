const ArtHistory = require('../models/ArtHistory');

exports.createPost = async (req, res) => {
  try {
    // Assuming req.user is set by authMiddleware and has role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can post to Art History' });
    }

    const { title, description, historyDate } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    
    if (!title || !description || !historyDate || !imageUrl) {
      return res.status(400).json({ message: 'Title, description, date, and image are required' });
    }

    const post = new ArtHistory({
      title,
      description,
      imageUrl,
      historyDate,
      author: req.user._id
    });

    await post.save();
    
    // Populate author before returning
    await post.populate('author', 'username profileImage');

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating art history post:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await ArtHistory.find()
      .populate('author', 'username profileImage')
      .sort({ historyDate: -1, createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching art history posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
