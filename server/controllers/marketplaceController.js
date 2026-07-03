const ArtRequest = require('../models/ArtRequest');
const Application = require('../models/Application');
const Chat = require('../models/Chat');
const Review = require('../models/Review');
const { createNotification } = require('../utils/notify');
const mongoose = require('mongoose');

const toUploadPath = (file) => `/uploads/${file.filename}`;

const parseLinks = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map(v => v.trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).map(v => v.trim()).filter(Boolean);
  } catch {}
  return String(value).split(/[\n,]/).map(v => v.trim()).filter(Boolean);
};

const getObjectId = (value) => value?._id || value;

const ensureParticipant = (chat, userId) => (
  getObjectId(chat.requester)?.toString() === userId.toString() ||
  getObjectId(chat.artist)?.toString() === userId.toString()
);

const ensureApplicationChat = async (application, request) => {
  const requestId = getObjectId(application.request) || getObjectId(request);
  const requesterId = getObjectId(request.creator);
  const artistId = getObjectId(application.artist);

  return Chat.findOneAndUpdate(
    { application: application._id },
    { request: requestId, application: application._id, requester: requesterId, artist: artistId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const attachChatIds = async (applications, requestsById = new Map()) => {
  if (!applications.length) return applications;

  const existingChats = await Chat.find({ application: { $in: applications.map(app => app._id) } }).select('_id application');
  const chatByApplication = new Map(existingChats.map(chat => [chat.application.toString(), chat._id]));
  const missingApplications = applications.filter(app => !chatByApplication.has(app._id.toString()));

  if (missingApplications.length) {
    const createdChats = await Promise.all(missingApplications.map(async (app) => {
      const requestId = getObjectId(app.request)?.toString();
      let request = requestsById.get(requestId);
      if (!request) request = await ArtRequest.findById(requestId).select('creator');
      if (!request) return null;
      return ensureApplicationChat(app, request);
    }));

    createdChats.filter(Boolean).forEach(chat => chatByApplication.set(chat.application.toString(), chat._id));
  }

  return applications.map((app) => {
    const item = typeof app.toObject === 'function' ? app.toObject() : app;
    const chatId = chatByApplication.get(app._id.toString());
    return { ...item, chatId: chatId ? chatId.toString() : null };
  });
};

const resolveChat = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;

  const chat = await Chat.findById(id);
  if (chat) return chat;

  const application = await Application.findById(id);
  if (!application) return null;

  const request = await ArtRequest.findById(application.request).select('creator');
  if (!request) return null;

  return ensureApplicationChat(application, request);
};

const getRequests = async (req, res) => {
  try {
    const { category, status = 'Open', minBudget, maxBudget, sort = 'latest' } = req.query;
    const query = {};
    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;
    if (minBudget || maxBudget) {
      query['budget.max'] = {};
      if (minBudget) query['budget.max'].$gte = Number(minBudget);
      if (maxBudget) query['budget.min'] = { $lte: Number(maxBudget) };
    }

    const sortBy = sort === 'budget-high' ? { 'budget.max': -1 } : { createdAt: -1 };
    const requests = await ArtRequest.find(query)
      .sort(sortBy)
      .populate('creator', 'username profileImage isVerified')
      .populate('acceptedArtist', 'username profileImage isVerified');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createRequest = async (req, res) => {
  try {
    const { title, description, category, budgetMin, budgetMax, deadline } = req.body;
    if (!title || !description || !category || !budgetMin || !budgetMax || !deadline) {
      return res.status(400).json({ message: 'All request fields are required' });
    }
    if (Number(budgetMin) > Number(budgetMax)) {
      return res.status(400).json({ message: 'Minimum budget cannot exceed maximum budget' });
    }

    const request = await ArtRequest.create({
      creator: req.user._id,
      title,
      description,
      category,
      budget: { min: Number(budgetMin), max: Number(budgetMax), currency: 'INR' },
      deadline,
      referenceImages: (req.files || []).map(toUploadPath),
      status: 'Open',
    });
    await request.populate('creator', 'username profileImage isVerified');
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRequest = async (req, res) => {
  try {
    const request = await ArtRequest.findById(req.params.id)
      .populate('creator', 'username profileImage isVerified')
      .populate('acceptedArtist', 'username profileImage isVerified');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const [applications, reviews] = await Promise.all([
      Application.find({ request: request._id })
        .sort({ createdAt: -1 })
        .populate('artist', 'username profileImage isVerified skills'),
      Review.find({ request: request._id })
        .populate('reviewer', 'username profileImage')
        .populate('artist', 'username profileImage'),
    ]);

    const isCreator = request.creator._id.toString() === req.user._id.toString();
    const applicationsWithChat = await attachChatIds(applications, new Map([[request._id.toString(), request]]));
    const response = request.toObject();
    response.applicationCount = applications.length;
    response.myApplication = applicationsWithChat.find(app => app.artist._id.toString() === req.user._id.toString()) || null;
    response.applications = isCreator ? applicationsWithChat : [];
    response.reviews = reviews;
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const applyForRequest = async (req, res) => {
  try {
    const request = await ArtRequest.findById(req.params.id).populate('creator', 'username');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Open') return res.status(400).json({ message: 'This request is not open for applications' });
    if (request.creator._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot apply to your own request' });
    }

    const application = await Application.create({
      request: request._id,
      artist: req.user._id,
      message: req.body.message,
      portfolioLinks: parseLinks(req.body.portfolioLinks),
      sampleFiles: (req.files || []).map(toUploadPath),
    });
    await application.populate('artist', 'username profileImage isVerified skills');
    const chat = await ensureApplicationChat(application, request);

    await createNotification(req, {
      recipient: request.creator._id,
      sender: req.user._id,
      type: 'marketplace_application',
      message: `${req.user.username} applied for "${request.title}"`,
      link: `/marketplace/chat/${chat._id}`,
    });

    res.status(201).json({ ...application.toObject(), chatId: chat._id.toString() });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You have already applied to this request' });
    res.status(500).json({ message: err.message });
  }
};

const getApplications = async (req, res) => {
  try {
    const [sent, receivedRequests] = await Promise.all([
      Application.find({ artist: req.user._id })
        .sort({ createdAt: -1 })
        .populate('request')
        .populate('artist', 'username profileImage isVerified'),
      ArtRequest.find({ creator: req.user._id }).select('_id'),
    ]);

    const received = await Application.find({ request: { $in: receivedRequests.map(r => r._id) } })
      .sort({ createdAt: -1 })
      .populate('request')
      .populate('artist', 'username profileImage isVerified skills');

    const requestIds = [
      ...sent.map(app => getObjectId(app.request)),
      ...received.map(app => getObjectId(app.request)),
    ].filter(Boolean).map(id => id.toString());
    const requests = await ArtRequest.find({ _id: { $in: requestIds } }).select('creator');
    const requestsById = new Map(requests.map(request => [request._id.toString(), request]));

    const [sentWithChat, receivedWithChat] = await Promise.all([
      attachChatIds(sent, requestsById),
      attachChatIds(received, requestsById),
    ]);

    res.json({ sent: sentWithChat, received: receivedWithChat });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRequestApplications = async (req, res) => {
  try {
    const request = await ArtRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.creator.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the creator can view all applications' });
    const applications = await Application.find({ request: request._id })
      .sort({ createdAt: -1 })
      .populate('artist', 'username profileImage isVerified skills');
    const applicationsWithChat = await attachChatIds(applications, new Map([[request._id.toString(), request]]));
    res.json(applicationsWithChat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const acceptApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('artist', 'username');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const request = await ArtRequest.findById(application.request);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.creator.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the creator can accept an artist' });
    if (request.status !== 'Open') return res.status(400).json({ message: 'This request is no longer open' });

    application.status = 'Accepted';
    await application.save();
    await Application.updateMany({ request: request._id, _id: { $ne: application._id } }, { status: 'Closed' });

    request.status = 'Pending';
    request.acceptedArtist = application.artist._id;
    request.acceptedApplication = application._id;
    await request.save();

    const chat = await Chat.findOneAndUpdate(
      { application: application._id },
      { request: request._id, application: application._id, requester: request.creator, artist: application.artist._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('request', 'title status').populate('requester artist', 'username profileImage');

    await createNotification(req, {
      recipient: application.artist._id,
      sender: req.user._id,
      type: 'marketplace_accepted',
      message: `Your proposal for "${request.title}" was accepted`,
      link: `/marketplace/chat/${chat._id}`,
    });

    res.json({ request, application, chat });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ $or: [{ requester: req.user._id }, { artist: req.user._id }] })
      .sort({ updatedAt: -1 })
      .populate('request', 'title status')
      .populate('application', '_id status')
      .populate('requester artist', 'username profileImage isVerified');
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getChat = async (req, res) => {
  try {
    const resolvedChat = await resolveChat(req.params.id);
    if (!resolvedChat) return res.status(404).json({ message: 'Chat not found' });

    const chat = await Chat.findById(resolvedChat._id)
      .populate('request')
      .populate('requester artist', 'username profileImage isVerified')
      .populate('messages.sender', 'username profileImage');
    if (!ensureParticipant(chat, req.user._id)) return res.status(403).json({ message: 'Not a chat participant' });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addChatMessage = async (req, res) => {
  try {
    const resolvedChat = await resolveChat(req.params.id);
    if (!resolvedChat) return res.status(404).json({ message: 'Chat not found' });

    const chat = await Chat.findById(resolvedChat._id).populate('request', 'title').populate('requester artist', 'username');
    if (!ensureParticipant(chat, req.user._id)) return res.status(403).json({ message: 'Not a chat participant' });

    const attachments = (req.files || []).map(file => ({
      url: toUploadPath(file),
      originalName: file.originalname,
      mimeType: file.mimetype,
    }));
    if (!req.body.message && attachments.length === 0) {
      return res.status(400).json({ message: 'Message or attachment is required' });
    }

    const message = {
      sender: req.user._id,
      message: req.body.message || '',
      attachments,
      kind: req.body.kind === 'final_submission' ? 'final_submission' : 'message',
    };
    chat.messages.push(message);
    await chat.save();
    await chat.populate('messages.sender', 'username profileImage');

    const created = chat.messages[chat.messages.length - 1];
    const recipient = chat.requester._id.toString() === req.user._id.toString() ? chat.artist._id : chat.requester._id;
    await createNotification(req, {
      recipient,
      sender: req.user._id,
      type: 'marketplace_message',
      message: `${req.user.username} sent a message for "${chat.request.title}"`,
      link: `/marketplace/chat/${chat._id}`,
    });

    const io = req.app.get('io');
    if (io) io.to(`marketplace_chat_${chat._id}`).emit('marketplace_message', created);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const submitFinalWork = async (req, res) => {
  req.body.kind = 'final_submission';
  return addChatMessage(req, res);
};

const completeRequest = async (req, res) => {
  try {
    const request = await ArtRequest.findById(req.params.id).populate('acceptedArtist', 'username');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.creator.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the creator can complete this request' });
    if (request.status !== 'Pending') return res.status(400).json({ message: 'Only pending requests can be completed' });

    request.status = 'Done';
    await request.save();
    await createNotification(req, {
      recipient: request.acceptedArtist._id,
      sender: req.user._id,
      type: 'marketplace_completed',
      message: `"${request.title}" was marked completed`,
      link: `/marketplace/requests/${request._id}`,
    });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createReview = async (req, res) => {
  try {
    const request = await ArtRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.creator.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the requester can review the artist' });
    if (request.status !== 'Done') return res.status(400).json({ message: 'Complete the request before reviewing' });
    if (!request.acceptedArtist) return res.status(400).json({ message: 'No accepted artist to review' });

    const review = await Review.create({
      request: request._id,
      artist: request.acceptedArtist,
      reviewer: req.user._id,
      rating: Number(req.body.rating),
      review: req.body.review,
    });
    await review.populate('reviewer', 'username profileImage');
    await review.populate('artist', 'username profileImage');

    await createNotification(req, {
      recipient: request.acceptedArtist,
      sender: req.user._id,
      type: 'marketplace_feedback',
      message: `${req.user.username} left feedback for "${request.title}"`,
      link: `/profile/${request.acceptedArtist}`,
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You already reviewed this request' });
    res.status(500).json({ message: err.message });
  }
};

const getArtistReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ artist: req.params.artistId })
      .sort({ createdAt: -1 })
      .populate('reviewer', 'username profileImage')
      .populate('request', 'title');
    const avg = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    res.json({ averageRating: Number(avg.toFixed(1)), count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
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
};
