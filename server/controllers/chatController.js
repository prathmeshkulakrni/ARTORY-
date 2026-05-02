const Message = require('../models/Message');

// @GET /api/chat/conversations
const getConversations = async (req, res) => {
  try {
    const messages = await Message.find({ $or: [{ sender: req.user._id }, { receiver: req.user._id }] })
      .sort({ createdAt: -1 })
      .populate('sender', 'username profileImage')
      .populate('receiver', 'username profileImage');

    const seen = new Set();
    const conversations = [];
    for (const msg of messages) {
      const partner = msg.sender._id.toString() === req.user._id.toString() ? msg.receiver : msg.sender;
      if (!seen.has(partner._id.toString())) {
        seen.add(partner._id.toString());
        conversations.push({ partner, lastMessage: msg });
      }
    }
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/chat/:userId
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 }).populate('sender', 'username profileImage');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/chat/:userId
const sendMessage = async (req, res) => {
  try {
    const { message, replyTo } = req.body;
    const msgData = { sender: req.user._id, receiver: req.params.userId, message };
    if (replyTo) msgData.replyTo = replyTo;
    const msg = await Message.create(msgData);
    await msg.populate('sender', 'username profileImage');
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getConversations, getMessages, sendMessage };
