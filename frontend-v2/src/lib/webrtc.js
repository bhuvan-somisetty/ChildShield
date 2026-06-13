// WebRTC peer helpers. The child (publisher) owns the media and creates the
// offer; the parent (viewer) answers. All SDP/ICE is relayed through the
// backend Socket.IO (the server never touches media). Sessions are keyed by
// `kind` (camera | audio | screen) so they run independently.

// ICE configuration. STUN handles same-network / cone-NAT cases; TURN is the
// relay fallback for symmetric NAT and cross-network (mobile data ↔ WiFi)
// scenarios where a direct path can't be negotiated. TURN is opt-in via build
// env vars so deployments without a TURN server keep STUN-only behaviour.
//   VITE_TURN_URLS        comma-separated, e.g. "turn:turn.host:3478,turns:turn.host:5349"
//   VITE_TURN_USERNAME    TURN username (or ephemeral username for time-limited creds)
//   VITE_TURN_CREDENTIAL  TURN credential/password
//   VITE_TURN_FORCE_RELAY "1" to force relay-only (iceTransportPolicy:'relay') — for testing TURN
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

function buildIceServers() {
  // STUN is always present (unchanged Google public STUN).
  const servers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  const urls = String(env.VITE_TURN_URLS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (urls.length) {
    const turn = { urls };
    if (env.VITE_TURN_USERNAME) turn.username = env.VITE_TURN_USERNAME;
    if (env.VITE_TURN_CREDENTIAL) turn.credential = env.VITE_TURN_CREDENTIAL;
    servers.push(turn);
  }
  return servers;
}

const ICE_SERVERS = buildIceServers();
const FORCE_RELAY = env.VITE_TURN_FORCE_RELAY === '1' || env.VITE_TURN_FORCE_RELAY === 'true';
// Shared RTCPeerConnection config for both viewer and publisher (same on every device).
export const RTC_CONFIG = { iceServers: ICE_SERVERS, iceTransportPolicy: FORCE_RELAY ? 'relay' : 'all' };
// Exposed for diagnostics (read-only); does not change behaviour.
export const iceServers = ICE_SERVERS;
export const turnEnabled = ICE_SERVERS.length > 1;

const match = (m, pairingId, kind) => m && m.pairingId === pairingId && m.kind === kind;

/**
 * Parent side. Requests a stream and renders the incoming one.
 * onStream(MediaStream), onStatus('requesting'|'accepted'|'declined'|'live'|'ended'|'error')
 */
export function createViewer({ socket, pairingId, kind, onStream, onStatus }) {
  let pc = null;
  const cleanup = () => { if (pc) { try { pc.close(); } catch {} pc = null; } };

  const onSignal = async (m) => {
    if (!match(m, pairingId, kind)) return;
    try {
      if (m.sdp && m.sdp.type === 'offer') {
        pc = new RTCPeerConnection(RTC_CONFIG);
        pc.ontrack = (e) => { onStream(e.streams[0]); onStatus('live'); };
        pc.onicecandidate = (e) => e.candidate && socket.emit('webrtc:signal', { pairingId, kind, candidate: e.candidate });
        pc.onconnectionstatechange = () => { if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) onStatus('ended'); };
        await pc.setRemoteDescription(m.sdp);
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        socket.emit('webrtc:signal', { pairingId, kind, sdp: pc.localDescription });
      } else if (m.candidate && pc) {
        await pc.addIceCandidate(m.candidate).catch(() => {});
      }
    } catch { onStatus('error'); }
  };
  const onAccept = (m) => match(m, pairingId, kind) && onStatus('accepted');
  const onDecline = (m) => match(m, pairingId, kind) && onStatus('declined');
  const onStop = (m) => { if (match(m, pairingId, kind)) { onStatus('ended'); cleanup(); } };

  socket.on('webrtc:signal', onSignal);
  socket.on('monitor:accept', onAccept);
  socket.on('monitor:decline', onDecline);
  socket.on('monitor:stop', onStop);

  onStatus('requesting');
  socket.emit('monitor:request', { pairingId, kind });

  return {
    control: (action, value) => socket.emit('monitor:control', { pairingId, kind, action, value }),
    stop: () => {
      socket.emit('monitor:stop', { pairingId, kind });
      socket.off('webrtc:signal', onSignal); socket.off('monitor:accept', onAccept);
      socket.off('monitor:decline', onDecline); socket.off('monitor:stop', onStop);
      cleanup();
    },
  };
}

/**
 * Child side. Publishes a captured MediaStream to the requesting parent.
 * onStatus(connectionState), onControl(action, value)
 */
export function createPublisher({ socket, pairingId, kind, stream, onStatus, onControl }) {
  const pc = new RTCPeerConnection(RTC_CONFIG);
  stream.getTracks().forEach((t) => pc.addTrack(t, stream));
  pc.onicecandidate = (e) => e.candidate && socket.emit('webrtc:signal', { pairingId, kind, candidate: e.candidate });
  pc.onconnectionstatechange = () => onStatus && onStatus(pc.connectionState);

  const onSignal = async (m) => {
    if (!match(m, pairingId, kind)) return;
    try {
      if (m.sdp && m.sdp.type === 'answer') await pc.setRemoteDescription(m.sdp);
      else if (m.candidate) await pc.addIceCandidate(m.candidate).catch(() => {});
    } catch {}
  };
  const onCtl = (m) => { if (match(m, pairingId, kind) && onControl) onControl(m.action, m.value); };
  socket.on('webrtc:signal', onSignal);
  socket.on('monitor:control', onCtl);

  (async () => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('monitor:accept', { pairingId, kind });
    socket.emit('webrtc:signal', { pairingId, kind, sdp: pc.localDescription });
  })();

  const teardown = () => {
    socket.off('webrtc:signal', onSignal); socket.off('monitor:control', onCtl);
    stream.getTracks().forEach((t) => t.stop());
    try { pc.close(); } catch {}
  };
  return {
    pc,
    replaceVideoTrack: (track) => { const s = pc.getSenders().find((x) => x.track && x.track.kind === 'video'); if (s) s.replaceTrack(track); },
    teardown, // local cleanup, no signal (use when the parent ended the session)
    stop: () => { socket.emit('monitor:stop', { pairingId, kind }); teardown(); },
  };
}

// Acquire the right media for a kind on the child device.
export async function captureMedia(kind, facing = 'environment') {
  if (kind === 'audio') return navigator.mediaDevices.getUserMedia({ audio: true });
  if (kind === 'screen') return navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
  // camera (with audio so parent can hear too)
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: true });
}
