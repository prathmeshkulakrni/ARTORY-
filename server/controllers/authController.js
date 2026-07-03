const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const normalizeAge = (age) => {
  const parsed = Number(age);
  return Number.isInteger(parsed) ? parsed : null;
};
const canViewAdultContent = (user) => user?.role === 'admin' || Number(user?.age) >= 18;
const adultFilterFor = (user) => canViewAdultContent(user) ? {} : { isAdultContent: { $ne: true } };

// @POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password, bio, skills, artInterests } = req.body;
    const age = normalizeAge(req.body.age);

    if (!age || age < 1 || age > 120) {
      return res.status(400).json({ message: 'Please enter a valid age' });
    }
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    if (await User.findOne({ username })) return res.status(400).json({ message: 'Username already taken' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ username, email, password: hashed, age, bio, skills, artInterests });
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      age: user.age,
      profileImage: user.profileImage,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      age: user.age,
      profileImage: user.profileImage,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('followers', 'username profileImage').populate('following', 'username profileImage');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const artworks = await require('../models/Artwork').find({ artist: user._id, ...adultFilterFor(user) }).sort({ createdAt: -1 });
    res.json({ ...user.toObject(), artworks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { username, bio, skills, artInterests, socialLinks } = req.body;
    const profileImage = req.file ? `/uploads/${req.file.filename}` : undefined;

    const update = { username, bio, skills, artInterests, socialLinks };
    if (profileImage) update.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/auth/user/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('followers', 'username profileImage').populate('following', 'username profileImage');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const artworks = await require('../models/Artwork').find({ artist: user._id, ...adultFilterFor(req.user) }).sort({ createdAt: -1 });
    const userObject = user.toObject();
    if (req.user.role !== 'admin') {
      delete userObject.email;
    }
    res.json({ ...userObject, artworks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/auth/search
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q?.trim()) return res.json([]);
    const users = await User.find({ username: { $regex: q.trim(), $options: 'i' } })
      .select('username profileImage isVerified')
      .limit(20);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile, getUserById, searchUsers };
