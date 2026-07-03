const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  getRequests,
  createRequest,
  getRequest,
  applyForRequest,
  getApplications,
  getRequestApplications,
  acceptApplication,
  getChats,
  getChat,
  addChatMessage,
  submitFinalWork,
  completeRequest,
  createReview,
  getArtistReviews,
} = require('../controllers/marketplaceController');

router.get('/requests', protect, getRequests);
router.post('/requests', protect, upload.array('referenceImages', 8), createRequest);
router.get('/requests/:id', protect, getRequest);
router.post('/requests/:id/apply', protect, upload.array('sampleFiles', 6), applyForRequest);
router.get('/requests/:id/applications', protect, getRequestApplications);
router.post('/requests/:id/complete', protect, completeRequest);
router.post('/requests/:id/reviews', protect, createReview);

router.get('/applications', protect, getApplications);
router.post('/applications/:id/accept', protect, acceptApplication);

router.get('/chats', protect, getChats);
router.get('/chats/:id', protect, getChat);
router.post('/chats/:id/messages', protect, upload.array('attachments', 8), addChatMessage);
router.post('/chats/:id/submit', protect, upload.array('attachments', 8), submitFinalWork);

router.get('/artists/:artistId/reviews', protect, getArtistReviews);

module.exports = router;
