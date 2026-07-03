const Notification = require('../models/Notification');

const createNotification = async (req, data) => {
  const recipientId = data.recipient?.toString?.() || data.recipient;
  const senderId = data.sender?.toString?.() || data.sender;
  if (recipientId && senderId && recipientId === senderId) return null;

  const notification = await Notification.create(data);
  await notification.populate('sender', 'username profileImage');

  const io = req.app?.get('io');
  if (io) io.emit('new_notification', notification);

  return notification;
};

const notifyMany = async (req, recipients, data) => {
  const uniqueRecipients = [...new Set(
    (recipients || [])
      .map(recipient => recipient?._id?.toString?.() || recipient?.toString?.() || recipient)
      .filter(Boolean)
  )];

  return Promise.all(
    uniqueRecipients.map(recipient => createNotification(req, { ...data, recipient }))
  );
};

module.exports = { createNotification, notifyMany };
