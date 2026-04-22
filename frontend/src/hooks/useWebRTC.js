import { useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

/**
 * Shared WebRTC hook. Used by parent (CameraView, AudioListener, ScreenView)
 * and child (ChildDeviceView) for peer-to-peer media streaming.
 *
 * @param {string} childId
 * @param {'parent'|'child'} role
 */
export function useWebRTC(childId, role) {
  const [connected, setConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnected, setPeerConnected] = useState(false);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  // Connect socket
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return socketRef.current;

    const socket = io(BACKEND, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('join-room', { childId, role });
      setConnected(true);
    });

    socket.on('peer-joined', ({ role: r }) => {
      setPeerConnected(true);
    });

    socket.on('peer-left', () => {
      setPeerConnected(false);
      closePeerConnection();
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setPeerConnected(false);
    });

    socketRef.current = socket;
    return socket;
  }, [childId, role]);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit('ice-candidate', { childId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setPeerConnected(false);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [childId]);

  // Close peer connection
  const closePeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setRemoteStream(null);
  }, []);

  // PARENT: Send offer to child
  const sendOffer = useCallback(async (mediaType) => {
    const pc = createPeerConnection();

    // Setup signaling listeners
    socketRef.current.on('answer', async ({ answer }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socketRef.current.on('ice-candidate', async ({ candidate }) => {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    });

    const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);

    socketRef.current.emit('offer', { childId, offer, mediaType });
  }, [childId, createPeerConnection]);

  // CHILD: Handle incoming offer and respond with answer
  const handleOffer = useCallback(async (offer, stream) => {
    const pc = createPeerConnection();

    // Add local stream tracks to peer
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    localStreamRef.current = stream;

    socketRef.current.on('ice-candidate', async ({ candidate }) => {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    });

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketRef.current.emit('answer', { childId, answer });
    setPeerConnected(true);
  }, [childId, createPeerConnection]);

  // Send command (switch camera, flash, stop, etc.)
  const sendCommand = useCallback((command, payload = {}) => {
    socketRef.current?.emit('command', { childId, command, payload });
  }, [childId]);

  // Disconnect everything
  const disconnect = useCallback(() => {
    closePeerConnection();
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnected(false);
    setPeerConnected(false);
  }, [closePeerConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    socket: socketRef,
    connected,
    peerConnected,
    remoteStream,
    connectSocket,
    sendOffer,
    handleOffer,
    sendCommand,
    disconnect,
    closePeerConnection,
    pcRef,
    localStreamRef
  };
}
