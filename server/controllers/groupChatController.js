const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');

// GET /api/groups
const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('creator', 'username profileImage')
      .populate('members', 'username profileImage')
      .sort({ updatedAt: -1 });
    res.json(groups);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/groups
const createGroup = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const members = [...new Set([req.user._id.toString(), ...(memberIds || [])])];
    const group = await Group.create({ name, creator: req.user._id, members });
    await group.populate('creator', 'username profileImage');
    await group.populate('members', 'username profileImage');
    res.status(201).json(group);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/groups/:id  — admin edits group name
const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group admin can edit' });
    }
    if (req.body.name) group.name = req.body.name;
    await group.save();
    await group.populate('creator', 'username profileImage');
    await group.populate('members', 'username profileImage');
    res.json(group);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/groups/:id/leave  — any member leaves
const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admin cannot leave — delete the group instead' });
    }
    group.members.pull(req.user._id);
    await group.save();
    res.json({ message: 'Left group' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/groups/:id/messages
const getGroupMessages = async (req, res) => {
  try {
    const messages = await GroupMessage.find({ group: req.params.id })
      .populate('sender', 'username profileImage')
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(messages);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/groups/:id/messages
const sendGroupMessage = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Not a member of this group' });
    const { message, replyTo } = req.body;
    const msgData = { group: req.params.id, sender: req.user._id, message };
    if (replyTo) msgData.replyTo = replyTo;
    const msg = await GroupMessage.create(msgData);
    await msg.populate('sender', 'username profileImage');
    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/groups/:id/members  — admin adds member
const addGroupMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group admin can add members' });
    }
    const { userId } = req.body;
    if (!group.members.some(m => m.toString() === userId)) {
      group.members.push(userId);
      await group.save();
    }
    await group.populate('members', 'username profileImage');
    res.json(group);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/groups/:id/members/:userId  — admin removes member
const removeGroupMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group admin can remove members' });
    }
    group.members.pull(req.params.userId);
    await group.save();
    res.json({ message: 'Member removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getMyGroups, createGroup, updateGroup, leaveGroup,
  getGroupMessages, sendGroupMessage, addGroupMember, removeGroupMember,
};
