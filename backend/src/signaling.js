/**
 * Socket.IO Signaling Server for WebRTC
 * Handles: Camera, Audio, Screen Sharing signaling between parent and child
 * No media data touches the server — pure relay for offers/answers/ICE candidates
 *
 * Stability fixes:
 *  - removeAllListeners guard prevents duplicate handler stacking on hot-reload
 *  - Proper disconnect cleanup
 *  - Namespaced room to avoid collision
 */

let _initialized = false;

module.exports = function initSignaling(io) {
  // Guard: only attach once (hot-reload safety)
  if (_initialized) {
    console.warn('[Signaling] Already initialized — skipping duplicate attach');
    return;
  }
  _initialized = true;

  io.on('connection', (socket) => {
    console.log(`[Signaling] Client connected: ${socket.id}`);

    // Join a room scoped to a child ID
    socket.on('join-room', ({ childId, role } = {}) => {
      if (!childId || !role) return;
      const room = `child-${childId}`;
      // Leave any previously joined rooms first (prevents duplicates)
      const currentRooms = [...socket.rooms].filter(r => r !== socket.id && r.startsWith('child-'));
      currentRooms.forEach(r => socket.leave(r));

      socket.join(room);
      socket.data = { childId, role };
      console.log(`[Signaling] ${role} joined room ${room}`);
      // Notify the other party
      socket.to(room).emit('peer-joined', { role });
    });

    // WebRTC signaling: offer
    socket.on('offer', ({ childId, offer, mediaType } = {}) => {
      if (!childId) return;
      const room = `child-${childId}`;
      socket.to(room).emit('offer', { offer, mediaType, from: socket.data?.role });
    });

    // WebRTC signaling: answer
    socket.on('answer', ({ childId, answer } = {}) => {
      if (!childId) return;
      const room = `child-${childId}`;
      socket.to(room).emit('answer', { answer, from: socket.data?.role });
    });

    // WebRTC signaling: ICE candidate
    socket.on('ice-candidate', ({ childId, candidate } = {}) => {
      if (!childId) return;
      const room = `child-${childId}`;
      socket.to(room).emit('ice-candidate', { candidate, from: socket.data?.role });
    });

    // Commands from parent to child (switch camera, flash, start/stop stream)
    socket.on('command', ({ childId, command, payload } = {}) => {
      if (!childId) return;
      const room = `child-${childId}`;
      socket.to(room).emit('command', { command, payload, from: socket.data?.role });
    });

    // Disconnect — clean up room
    socket.on('disconnect', (reason) => {
      const { childId, role } = socket.data || {};
      if (childId) {
        const room = `child-${childId}`;
        socket.to(room).emit('peer-left', { role });
      }
      console.log(`[Signaling] Client disconnected: ${socket.id} (reason: ${reason})`);
    });

    // Handle socket errors without crashing the server
    socket.on('error', (err) => {
      console.error(`[Signaling] Socket error for ${socket.id}:`, err.message);
    });
  });
};
