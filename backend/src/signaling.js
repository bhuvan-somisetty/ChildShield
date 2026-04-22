/**
 * Socket.IO Signaling Server for WebRTC
 * Handles: Camera, Audio, Screen Sharing signaling between parent and child
 * No media data touches the server — pure relay for offers/answers/ICE candidates
 */
module.exports = function initSignaling(io) {
  io.on('connection', (socket) => {
    console.log(`[Signaling] Client connected: ${socket.id}`);

    // Join a room scoped to a child ID
    socket.on('join-room', ({ childId, role }) => {
      if (!childId || !role) return;
      const room = `child-${childId}`;
      socket.join(room);
      socket.data = { childId, role };
      console.log(`[Signaling] ${role} joined room ${room}`);
      // Notify the other party
      socket.to(room).emit('peer-joined', { role });
    });

    // WebRTC signaling: offer
    socket.on('offer', ({ childId, offer, mediaType }) => {
      const room = `child-${childId}`;
      socket.to(room).emit('offer', { offer, mediaType, from: socket.data?.role });
    });

    // WebRTC signaling: answer
    socket.on('answer', ({ childId, answer }) => {
      const room = `child-${childId}`;
      socket.to(room).emit('answer', { answer, from: socket.data?.role });
    });

    // WebRTC signaling: ICE candidate
    socket.on('ice-candidate', ({ childId, candidate }) => {
      const room = `child-${childId}`;
      socket.to(room).emit('ice-candidate', { candidate, from: socket.data?.role });
    });

    // Commands from parent to child (switch camera, flash, start/stop stream)
    socket.on('command', ({ childId, command, payload }) => {
      const room = `child-${childId}`;
      socket.to(room).emit('command', { command, payload, from: socket.data?.role });
    });

    // Disconnect
    socket.on('disconnect', () => {
      const { childId, role } = socket.data || {};
      if (childId) {
        const room = `child-${childId}`;
        socket.to(room).emit('peer-left', { role });
      }
      console.log(`[Signaling] Client disconnected: ${socket.id}`);
    });
  });
};
