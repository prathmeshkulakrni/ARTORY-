const express = require('express');
const router = express.Router();
const {
  getMyGroups, createGroup, updateGroup, leaveGroup,
  getGroupMessages, sendGroupMessage, addGroupMember, removeGroupMember,
} = require('../controllers/groupChatController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMyGroups);
router.post('/', protect, createGroup);
router.put('/:id', protect, updateGroup);
router.post('/:id/leave', protect, leaveGroup);
router.get('/:id/messages', protect, getGroupMessages);
router.post('/:id/messages', protect, sendGroupMessage);
router.post('/:id/members', protect, addGroupMember);
router.delete('/:id/members/:userId', protect, removeGroupMember);

module.exports = router;
