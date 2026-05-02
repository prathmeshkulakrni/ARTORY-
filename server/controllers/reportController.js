const Report = require('../models/Report');

const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, details = '' } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'Missing required report fields' });
    }

    if (reason === 'other' && (!details.trim() || details.trim().length > 100)) {
      return res.status(400).json({ message: 'Other reason must include 1 to 100 characters' });
    }

    const existing = await Report.findOne({
      reporter: req.user._id,
      targetType,
      targetId
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already reported this item' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      details: details.trim()
    });

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createReport };
