const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // User comes online
    socket.on('user_online', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // ─── Private DM ─────────────────────────────────────────────────────────

    socket.on('join_room', ({ senderId, receiverId }) => {
      const room = [senderId, receiverId].sort().join('_');
      socket.join(room);
    });

    socket.on('send_message', ({ senderId, receiverId, message, senderInfo, replyTo }) => {
      const room = [senderId, receiverId].sort().join('_');
      io.to(room).emit('receive_message', {
        sender: senderInfo,
        receiver: receiverId,
        message,
        replyTo: replyTo || null,
        createdAt: new Date(),
      });
    });

    socket.on('typing', ({ senderId, receiverId }) => {
      const room = [senderId, receiverId].sort().join('_');
      socket.to(room).emit('user_typing', { userId: senderId });
    });

    socket.on('stop_typing', ({ senderId, receiverId }) => {
      const room = [senderId, receiverId].sort().join('_');
      socket.to(room).emit('user_stop_typing', { userId: senderId });
    });

    // ─── Group Chat ──────────────────────────────────────────────────────────

    socket.on('join_group_room', (groupId) => {
      socket.join(`group_${groupId}`);
    });

    socket.on('send_group_message', ({ groupId, message, senderInfo, replyTo }) => {
      io.to(`group_${groupId}`).emit('receive_group_message', {
        group: groupId,
        sender: senderInfo,
        message,
        replyTo: replyTo || null,
        createdAt: new Date(),
      });
    });

    socket.on('group_typing', ({ groupId, userId }) => {
      socket.to(`group_${groupId}`).emit('group_user_typing', { userId });
    });

    socket.on('group_stop_typing', ({ groupId, userId }) => {
      socket.to(`group_${groupId}`).emit('group_user_stop_typing', { userId });
    });

    // ─── Community Chat ──────────────────────────────────────────────────────

    socket.on('join_community_room', (communityId) => {
      socket.join(`community_${communityId}`);
    });

    socket.on('send_community_message', ({ communityId, message, senderInfo, replyTo }) => {
      io.to(`community_${communityId}`).emit('receive_community_message', {
        community: communityId,
        sender: senderInfo,
        message,
        replyTo: replyTo || null,
        createdAt: new Date(),
      });
    });

    socket.on('community_typing', ({ communityId, userId }) => {
      socket.to(`community_${communityId}`).emit('community_user_typing', { userId });
    });

    socket.on('community_stop_typing', ({ communityId, userId }) => {
      socket.to(`community_${communityId}`).emit('community_user_stop_typing', { userId });
    });

    // ─── Collaborative Drawing ───────────────────────────────────────────────

    socket.on('join_board', (boardId) => {
      socket.join(`board_${boardId}`);
    });

    socket.on('draw_event', ({ boardId, drawData }) => {
      socket.to(`board_${boardId}`).emit('draw_event', drawData);
    });

    socket.on('clear_board', (boardId) => {
      io.to(`board_${boardId}`).emit('clear_board');
    });

    // ─── Notifications ───────────────────────────────────────────────────────

    socket.on('send_notification', ({ recipientId, notification }) => {
      const recipientSocket = onlineUsers.get(recipientId);
      if (recipientSocket) {
        io.to(recipientSocket).emit('new_notification', notification);
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log('🔌 Socket disconnected:', socket.id);
    });
  });
};

module.exports = socketHandler;
