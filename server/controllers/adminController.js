const Artwork = require('../models/Artwork');
const Community = require('../models/Community');
const Competition = require('../models/Competition');
const Comic = require('../models/Comic');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');

const reportTargetModels = {
  artwork: Artwork,
  community: Community,
  comic: Comic,
  user: User,
  competition: Competition
};

const attachReportTargets = async (reports) => {
  return Promise.all(reports.map(async (report) => {
    const reportObject = report.toObject();
    const Model = reportTargetModels[report.targetType];
    if (!Model) return reportObject;

    let query = Model.findById(report.targetId);
    if (report.targetType === 'artwork') query = query.populate('artist', 'username profileImage');
    if (report.targetType === 'community') query = query.populate('creator', 'username profileImage');
    if (report.targetType === 'competition') query = query.populate('organizer', 'username profileImage');
    if (report.targetType === 'comic') query = query.populate('creator', 'username profileImage');

    reportObject.target = await query.select('-password');
    return reportObject;
  }));
};

const getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalArtworks, totalCommunities, users, artworks, communities, rawReports, verificationRequests, competitionRequests] = await Promise.all([
      User.countDocuments(),
      Artwork.countDocuments(),
      Community.countDocuments(),
      User.find().select('username email role profileImage isVerified createdAt').sort({ createdAt: -1 }).limit(50),
      Artwork.find()
        .select('title imageUrl artist createdAt')
        .populate('artist', 'username profileImage')
        .sort({ createdAt: -1 })
        .limit(50),
      Community.find()
        .select('name category creator members coverImage createdAt')
        .populate('creator', 'username profileImage')
        .sort({ createdAt: -1 })
        .limit(50),
      Report.find()
        .populate('reporter', 'username profileImage')
        .sort({ createdAt: -1 })
        .limit(50),
      VerificationRequest.find()
        .populate('applicant', 'username profileImage email')
        .sort({ createdAt: -1 })
        .limit(50),
      Competition.find({ status: 'pending' })
        .populate('organizer', 'username profileImage')
        .sort({ createdAt: -1 })
        .limit(50)
    ]);
    const reports = await attachReportTargets(rawReports);

    res.json({
      stats: {
        totalUsers,
        totalArtworks,
        totalCommunities
      },
      users,
      artworks,
      communities,
      reports,
      verificationRequests,
      competitionRequests
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markReportReviewed = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { status: 'reviewed' }, { new: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteArtworkAsAdmin = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });

    await Community.updateMany({ posts: artwork._id }, { $pull: { posts: artwork._id } });
    await artwork.deleteOne();

    res.json({ message: 'Artwork deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteCommunityAsAdmin = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    await community.deleteOne();
    res.json({ message: 'Community deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUserAsAdmin = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userArtworkIds = await Artwork.find({ artist: user._id }).distinct('_id');

    await Artwork.deleteMany({ artist: user._id });
    await Community.deleteMany({ creator: user._id });
    await Community.updateMany(
      {},
      {
        $pull: {
          members: user._id,
          moderators: user._id,
          posts: { $in: userArtworkIds }
        }
      }
    );
    await User.updateMany({}, { $pull: { followers: user._id, following: user._id } });
    await Notification.deleteMany({
      $or: [{ recipient: user._id }, { sender: user._id }]
    });
    await user.deleteOne();

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getDashboard,
  deleteArtworkAsAdmin,
  deleteCommunityAsAdmin,
  deleteUserAsAdmin,
  markReportReviewed
};
