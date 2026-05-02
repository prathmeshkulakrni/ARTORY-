const express = require('express');
const {
  getDashboard,
  deleteArtworkAsAdmin,
  deleteCommunityAsAdmin,
  deleteUserAsAdmin,
  markReportReviewed
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.delete('/users/:id', deleteUserAsAdmin);
router.delete('/communities/:id', deleteCommunityAsAdmin);
router.delete('/artworks/:id', deleteArtworkAsAdmin);
router.put('/reports/:id/review', markReportReviewed);

module.exports = router;
