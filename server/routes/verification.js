const express = require('express');
const {
  submitVerificationRequest,
  getMyVerificationRequest,
  reviewVerificationRequest
} = require('../controllers/verificationController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/me', protect, getMyVerificationRequest);
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'aadhaarImage', maxCount: 1 },
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'certificateImage', maxCount: 1 }
  ]),
  submitVerificationRequest
);
router.put('/:id/review', protect, adminOnly, reviewVerificationRequest);

module.exports = router;
