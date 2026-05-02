const Community = require('../models/Community');
const Artwork = require('../models/Artwork');
const CommunityMessage = require('../models/CommunityMessage');

// @POST /api/community
const createCommunity = async (req, res) => {
  try {
    const { name, description, category, isPrivate } = req.body;
    const coverImage = req.file ? `/uploads/${req.file.filename}` : '';
    const community = await Community.create({
      name, description, category, coverImage,
      creator: req.user._id,
      members: [req.user._id],
      moderators: [req.user._id],
      isPrivate: isPrivate === 'true' || isPrivate === true,
    });
    res.status(201).json(community);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/community
const getAllCommunities = async (req, res) => {
  try {
    const communities = await Community.find()
      .populate('creator', 'username profileImage')
      .sort({ createdAt: -1 });
    res.json(communities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/community/:id
const getCommunityById = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('creator', 'username profileImage')
      .populate('members', 'username profileImage')
      .populate({ path: 'posts', populate: { path: 'artist', select: 'username profileImage' } });
    if (!community) return res.status(404).json({ message: 'Not found' });
    res.json(community);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/community/:id  (admin: edit name, description, isPrivate)
const updateCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Not found' });
    if (community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only creator can edit' });
    }
    const { name, description, isPrivate } = req.body;
    if (name !== undefined) community.name = name;
    if (description !== undefined) community.description = description;
    if (isPrivate !== undefined) community.isPrivate = isPrivate === 'true' || isPrivate === true || isPrivate === 1;
    await community.save();
    res.json(community);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/community/:id/join
const joinCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Not found' });

    const isMember = community.members.some(m => m.toString() === req.user._id.toString());

    if (isMember) {
      // Leave community
      community.members.pull(req.user._id);
      await community.save();
      return res.json({ joined: false, membersCount: community.members.length });
    }

    if (community.isPrivate) {
      // Check if already requested
      const alreadyRequested = community.joinRequests.some(
        r => r.user.toString() === req.user._id.toString()
      );
      if (alreadyRequested) {
        // Cancel request
        community.joinRequests = community.joinRequests.filter(
          r => r.user.toString() !== req.user._id.toString()
        );
        await community.save();
        return res.json({ requested: false, cancelled: true });
      }
      // Send join request
      community.joinRequests.push({ user: req.user._id });
      await community.save();
      return res.json({ requested: true, joined: false });
    }

    // Public: join directly
    community.members.push(req.user._id);
    await community.save();
    res.json({ joined: true, membersCount: community.members.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/community/:id/join-requests  (admin only)
const getJoinRequests = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('joinRequests.user', 'username profileImage email bio');
    if (!community) return res.status(404).json({ message: 'Not found' });
    if (community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only creator can view requests' });
    }
    res.json(community.joinRequests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/community/:id/join-requests/:userId/handle  (admin: accept or reject)
const handleJoinRequest = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Not found' });
    if (community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only creator can handle requests' });
    }
    const { action } = req.body; // 'accept' or 'reject'
    const { userId } = req.params;

    // Remove from joinRequests
    community.joinRequests = community.joinRequests.filter(
      r => r.user.toString() !== userId
    );

    if (action === 'accept') {
      if (!community.members.some(m => m.toString() === userId)) {
        community.members.push(userId);
      }
    }

    await community.save();
    res.json({ message: action === 'accept' ? 'Member accepted' : 'Request rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/community/:id/post
const addPostToCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Not found' });

    const { artworkId } = req.body;
    community.posts.push(artworkId);
    await community.save();
    res.json({ message: 'Post added to community' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/community/:id
const deleteCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Not found' });
    if (community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only creator can delete' });
    }
    await Community.findByIdAndDelete(req.params.id);
    res.json({ message: 'Community deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/community/:id/remove-member
const removeMember = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Not found' });
    if (community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only creator can remove members' });
    }
    const { memberId } = req.body;
    community.members.pull(memberId);
    await community.save();
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/community/:id/images
const updateCommunityImages = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Not found' });
    if (community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only creator can update images' });
    }
    if (req.files?.coverImage) community.coverImage = `/uploads/${req.files.coverImage[0].filename}`;
    if (req.files?.avatar) community.avatar = `/uploads/${req.files.avatar[0].filename}`;
    await community.save();
    res.json(community);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/community/:id/messages
const getCommunityMessages = async (req, res) => {
  try {
    const messages = await CommunityMessage.find({ community: req.params.id })
      .populate('sender', 'username profileImage')
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/community/:id/messages
const sendCommunityMessage = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Not found' });
    const isMember = community.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Members only' });
    const { message, replyTo } = req.body;
    const msgData = { community: req.params.id, sender: req.user._id, message };
    if (replyTo) msgData.replyTo = replyTo;
    const msg = await CommunityMessage.create(msgData);
    await msg.populate('sender', 'username profileImage');
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createCommunity, getAllCommunities, getCommunityById, updateCommunity,
  joinCommunity, getJoinRequests, handleJoinRequest,
  addPostToCommunity, deleteCommunity, removeMember, updateCommunityImages,
  getCommunityMessages, sendCommunityMessage,
};
