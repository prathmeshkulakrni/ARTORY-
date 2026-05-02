const express = require('express');
const router = express.Router();
const {
  createCommunity, getAllCommunities, getCommunityById, updateCommunity,
  joinCommunity, getJoinRequests, handleJoinRequest,
  addPostToCommunity, deleteCommunity, removeMember, updateCommunityImages,
  getCommunityMessages, sendCommunityMessage,
} = require('../controllers/communityController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getAllCommunities);
router.post('/', protect, upload.single('coverImage'), createCommunity);
router.get('/:id', protect, getCommunityById);
router.put('/:id', protect, updateCommunity);
router.delete('/:id', protect, deleteCommunity);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/post', protect, addPostToCommunity);
router.post('/:id/remove-member', protect, removeMember);
router.put('/:id/images', protect, upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]), updateCommunityImages);
router.get('/:id/join-requests', protect, getJoinRequests);
router.post('/:id/join-requests/:userId/handle', protect, handleJoinRequest);
router.get('/:id/messages', protect, getCommunityMessages);
router.post('/:id/messages', protect, sendCommunityMessage);

module.exports = router;
