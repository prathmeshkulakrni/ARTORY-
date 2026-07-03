const Competition = require('../models/Competition');
const { createNotification } = require('../utils/notify');

const createCompetition = async (req, res) => {
  try {
    const { title, description, category, deadline, prize } = req.body;
    const coverImage = req.file ? `/uploads/${req.file.filename}` : '';
    const comp = await Competition.create({ title, description, category, deadline, prize, coverImage, organizer: req.user._id });
    res.status(201).json(comp);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getAllCompetitions = async (req, res) => {
  try {
    const comps = await Competition.find()
      .sort({ createdAt: -1 })
      .populate('organizer', 'username profileImage')
      .populate('participants', 'username profileImage')
      .populate('submissions.artist', 'username profileImage')
      .populate('winners.artist', 'username profileImage');
    
    // Hide submissions from regular users, but allow them to see their own submission
    const processedComps = comps.map(comp => {
      const cObj = comp.toObject();
      const isOrganizer = cObj.organizer._id.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!isOrganizer && !isAdmin) {
        cObj.submissions = cObj.submissions.filter(s => s.artist && s.artist._id.toString() === req.user._id.toString());
      }
      return cObj;
    });
    
    res.json(processedComps);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getCompetitionById = async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id)
      .populate('organizer', 'username profileImage')
      .populate('participants', 'username profileImage')
      .populate('submissions.artist', 'username profileImage')
      .populate('winners.artist', 'username profileImage');
    if (!comp) return res.status(404).json({ message: 'Not found' });

    const cObj = comp.toObject();
    const isOrganizer = cObj.organizer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      cObj.submissions = cObj.submissions.filter(s => s.artist && s.artist._id.toString() === req.user._id.toString());
    }
    res.json(cObj);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/competition/:id/join  — join the competition
const joinCompetition = async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: 'Not found' });
    if (comp.status !== 'approved') return res.status(400).json({ message: 'Competition not active' });
    if (comp.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already joined' });
    }
    comp.participants.push(req.user._id);
    await comp.save();
    await createNotification(req, {
      recipient: comp.organizer,
      sender: req.user._id,
      type: 'competition',
      message: `${req.user.username} joined "${comp.title}"`,
      link: '/competitions',
    });
    res.json({ message: 'Joined successfully', participantsCount: comp.participants.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/competition/:id/submit  — submit image (multipart)
const submitImage = async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: 'Not found' });
    if (comp.status !== 'approved') return res.status(400).json({ message: 'Competition not approved' });
    if (new Date() > comp.deadline) return res.status(400).json({ message: 'Deadline has passed' });
    if (!comp.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You must join the competition first' });
    }
    const alreadySubmitted = comp.submissions.some(s => s.artist.toString() === req.user._id.toString());
    if (alreadySubmitted) return res.status(400).json({ message: 'Already submitted' });
    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    const imageUrl = `/uploads/${req.file.filename}`;
    comp.submissions.push({ artist: req.user._id, imageUrl });
    await comp.save();
    await createNotification(req, {
      recipient: comp.organizer,
      sender: req.user._id,
      type: 'competition',
      message: `${req.user.username} submitted artwork for "${comp.title}"`,
      link: '/competitions',
    });
    res.json({ message: 'Submitted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/competition/:id/winners  — organizer picks top 3
const pickWinners = async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id).populate('organizer');
    if (!comp) return res.status(404).json({ message: 'Not found' });
    const isOrganizer = comp.organizer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) return res.status(403).json({ message: 'Only organizer or admin can pick winners' });

    // winners: [{rank, artistId}]
    const { winners } = req.body; // [{rank:1, artistId:'...'}, ...]
    if (!Array.isArray(winners) || winners.length === 0) return res.status(400).json({ message: 'Provide winners array' });

    const builtWinners = winners.map(w => {
      const sub = comp.submissions.find(s => s.artist.toString() === w.artistId);
      if (!sub) throw new Error(`No submission found for artist ${w.artistId}`);
      return { rank: w.rank, artist: w.artistId, imageUrl: sub.imageUrl };
    });

    comp.winners = builtWinners;
    await comp.save();
    await comp.populate('winners.artist', 'username profileImage');

    // Notify winners
    for (const w of builtWinners) {
      await createNotification(req, {
        recipient: w.artist,
        sender: req.user._id,
        type: 'competition',
        message: `🏆 Congratulations! You placed #${w.rank} in "${comp.title}"!`,
        link: '/competitions',
      });
    }

    res.json(comp);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const approveCompetition = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can approve' });
    const { status } = req.body;
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: 'Competition not found' });
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    comp.status = status;
    await comp.save();
    await createNotification(req, {
      recipient: comp.organizer,
      sender: req.user._id,
      type: 'competition',
      message: status === 'approved' ? 'Congratulations! Your competition request was approved.' : 'Sorry, your competition request was not accepted.',
      link: '/competitions',
    });
    res.json(comp);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getSubmissions = async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id).populate('submissions.artist', 'username profileImage');
    if (!comp) return res.status(404).json({ message: 'Not found' });
    const isOrganizer = comp.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) return res.status(403).json({ message: 'Access denied' });
    res.json(comp.submissions);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/competition/:id/end — organizer or admin can manually end early
const endCompetition = async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: 'Not found' });
    const isOrganizer = comp.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) return res.status(403).json({ message: 'Only organizer or admin can end competition' });

    // Set deadline to now
    comp.deadline = new Date();
    await comp.save();
    
    res.json({ message: 'Competition ended successfully', comp });
  } catch (err) { 
    console.error("End competition error:", err);
    res.status(500).json({ message: err.message, stack: err.stack }); 
  }
};

module.exports = {
  createCompetition, getAllCompetitions, getCompetitionById,
  joinCompetition, submitImage, pickWinners, approveCompetition, getSubmissions, endCompetition,
};
