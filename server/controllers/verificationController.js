const Notification = require('../models/Notification');
const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');

const submitVerificationRequest = async (req, res) => {
  try {
    if (req.user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    const existing = await VerificationRequest.findOne({ applicant: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You can submit verification only one time' });
    }

    const aadhaarImage = req.files?.aadhaarImage?.[0] ? `/uploads/${req.files.aadhaarImage[0].filename}` : '';
    const passportPhoto = req.files?.passportPhoto?.[0] ? `/uploads/${req.files.passportPhoto[0].filename}` : '';
    const certificateImage = req.files?.certificateImage?.[0] ? `/uploads/${req.files.certificateImage[0].filename}` : '';

    if (!aadhaarImage || !passportPhoto || !certificateImage) {
      return res.status(400).json({ message: 'All verification files are required' });
    }

    const request = await VerificationRequest.create({
      applicant: req.user._id,
      aadhaarImage,
      passportPhoto,
      certificateImage,
      status: 'pending'
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyVerificationRequest = async (req, res) => {
  try {
    const request = await VerificationRequest.findOne({ applicant: req.user._id });
    res.json(request || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const reviewVerificationRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await VerificationRequest.findById(req.params.id).populate('applicant', 'username');

    if (!request) return res.status(404).json({ message: 'Verification request not found' });
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    await User.findByIdAndUpdate(request.applicant._id, { isVerified: status === 'approved' });

    await Notification.create({
      recipient: request.applicant._id,
      sender: req.user._id,
      type: 'system',
      message: status === 'approved'
        ? 'Your verification request has been approved.'
        : 'Your verification request has been rejected.',
      link: `/profile/${request.applicant._id}`
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  submitVerificationRequest,
  getMyVerificationRequest,
  reviewVerificationRequest
};
