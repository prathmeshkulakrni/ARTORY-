const User = require('../models/User');
const Notification = require('../models/Notification');

// @POST /api/social/follow/:id
const followUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ message: "Can't follow yourself" });

    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user._id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const isFollowing = me.following.includes(target._id);
    if (isFollowing) {
      me.following.pull(target._id);
      target.followers.pull(me._id);
    } else {
      me.following.push(target._id);
      target.followers.push(me._id);
      if (target._id.toString() !== me._id.toString()) {
        await Notification.create({
          recipient: target._id,
          sender: me._id,
          type: 'follow',
          message: `you got a new follower ${me.username}`,
          link: `/profile/${me._id}`
        });
      }
    }
    await me.save();
    await target.save();
    res.json({ following: !isFollowing, followersCount: target.followers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/social/suggestions
const getSuggestions = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const users = await User.find({ _id: { $nin: [...me.following, me._id] } })
      .select('username profileImage bio followers')
      .limit(6);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/social/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }).limit(30)
      .populate('sender', 'username profileImage');
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/social/notifications/read
const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { followUser, getSuggestions, getNotifications, markNotificationsRead };
