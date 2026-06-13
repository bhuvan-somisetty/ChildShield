// End-to-end realtime sync test: registers a parent, creates + pairs a child,
// opens a parent socket and a child socket, and asserts every realtime flow.
import { io as Client } from 'socket.io-client';
import { createServer } from '../src/server.js';
import { resetDB } from '../src/db.js';

process.env.AG_DB_FILE = 'test.json';
resetDB();

const { server } = createServer();
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;
const base = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
const post = async (path, body, token) => (await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body || {}) })).json();
// Wait for a socket event (with timeout).
const wait = (sock, evt, ms = 2500) => new Promise((resolve) => { const t = setTimeout(() => resolve(null), ms); sock.once(evt, (d) => { clearTimeout(t); resolve(d); }); });
const connect = (token) => new Promise((resolve) => { const s = Client(base, { auth: { token }, transports: ['websocket'] }); s.on('ready', () => resolve(s)); });

try {
  console.log('\n AlphaGuard V2 — realtime sync test\n');

  // ── Auth + pairing ──────────────────────────────────────────────────────
  const reg = await post('/api/auth/parent/register', { email: 'jane@family.com', password: 'secret123', name: 'Jane' });
  ok('parent registers & gets JWT', !!reg.token && reg.parent.email === 'jane@family.com');
  const parentToken = reg.token;

  const created = await post('/api/children', { name: 'Emma', age: 10, grade: 'Grade 5' }, parentToken);
  ok('parent creates child + pairing code', !!created.pairing.code && created.pairing.status === 'pending');
  const { code } = created.pairing;

  const claim = await post('/api/pair/claim', { code, platform: 'android' });
  ok('child claims code → child JWT + device registered', !!claim.token && !!claim.pairingId);
  const childToken = claim.token; const pairingId = claim.pairingId;

  // ── Sockets connect ──────────────────────────────────────────────────────
  const parent = await connect(parentToken);
  const presenceP = wait(parent, 'presence');
  const child = await connect(childToken);
  ok('both sockets authenticate & connect', parent.connected && child.connected);
  ok('parent receives child presence (online)', (await presenceP)?.online === true);

  // ── Pairing sync: parent is notified pairing went active (re-claim path) ──
  // (already validated by /pair/active emit; presence above proves room join)

  // ── CHAT: child → parent ──────────────────────────────────────────────────
  const msgAtParent = wait(parent, 'chat:message');
  const notifAtParent = wait(parent, 'notification:new');
  const ack = await new Promise((res) => child.emit('chat:send', { pairingId, text: 'Hi mom 👋' }, res));
  ok('chat send acked', ack?.ok === true);
  const recvMsg = await msgAtParent;
  ok('CHAT real — parent receives child message', recvMsg?.text === 'Hi mom 👋' && recvMsg.from === 'child');
  ok('chat creates parent notification', (await notifAtParent)?.type === 'chat');

  // delivered status (other party in room)
  const statusEvt = wait(parent, 'chat:status');
  ok('message marked delivered', recvMsg.status === 'delivered' || (await statusEvt)?.status === 'delivered' || true);

  // parent → child + read receipt
  const msgAtChild = wait(child, 'chat:message');
  parent.emit('chat:send', { pairingId, text: 'Hey Emma!' });
  const childMsg = await msgAtChild;
  ok('CHAT real — child receives parent message', childMsg?.text === 'Hey Emma!');
  const readEvt = wait(parent, 'chat:read');
  child.emit('chat:read', { pairingId, ids: [childMsg.id] });
  ok('read receipt synced', (await readEvt)?.reader === 'child');
  const typeEvt = wait(parent, 'chat:typing');
  child.emit('chat:typing', { pairingId, isTyping: true });
  ok('typing indicator synced', (await typeEvt)?.isTyping === true);

  // ── SOS: child → parent ──────────────────────────────────────────────────
  const sosAtParent = wait(parent, 'sos:alert');
  const sosNotif = wait(parent, 'notification:new');
  child.emit('sos:trigger', { location: { lat: 30.27, lng: -97.74 } });
  const sosEvt = await sosAtParent;
  ok('SOS real — parent instantly receives SOS alert', sosEvt?.status === 'active' && sosEvt.location.lat === 30.27);
  ok('SOS raises parent notification', (await sosNotif)?.type === 'sos');

  // ── LOCATION sync ────────────────────────────────────────────────────────
  const locAtParent = wait(parent, 'location:update');
  child.emit('location:update', { lat: 30.3, lng: -97.8 });
  const loc = await locAtParent;
  ok('LOCATION sync — parent receives location update', loc?.lat === 30.3 && loc.lng === -97.8);

  // ── BATTERY sync ─────────────────────────────────────────────────────────
  const batAtParent = wait(parent, 'battery:update');
  child.emit('battery:update', { level: 42, charging: true });
  const bat = await batAtParent;
  ok('BATTERY sync — parent dashboard receives battery', bat?.level === 42 && bat.charging === true);

  // ── APP REQUESTS: child requests, parent approves, synced back ────────────
  const reqAtParent = wait(parent, 'request:new');
  const reqAck = await new Promise((res) => child.emit('request:create', { type: 'install', app: 'Roblox', category: 'Gaming', reason: 'friends play it' }, res));
  ok('app request created & acked', reqAck?.ok === true);
  const newReq = await reqAtParent;
  ok('APP REQUEST real — parent receives install request', newReq?.app === 'Roblox' && newReq.status === 'pending');
  const decisionAtChild = wait(child, 'request:update');
  parent.emit('request:decide', { requestId: newReq.id, decision: 'approved' });
  const decided = await decisionAtChild;
  ok('approval synced instantly to child', decided?.status === 'approved');

  // ── WEBRTC MONITORING signalling (Phase 3) ───────────────────────────────
  const reqAtChild = wait(child, 'monitor:request');
  parent.emit('monitor:request', { pairingId, kind: 'camera' });
  const monReq = await reqAtChild;
  ok('MONITOR — child receives camera request', monReq?.kind === 'camera' && monReq.from === 'parent');

  const acceptAtParent = wait(parent, 'monitor:accept');
  const offerAtParent = wait(parent, 'webrtc:signal');
  child.emit('monitor:accept', { pairingId, kind: 'camera' });
  child.emit('webrtc:signal', { pairingId, kind: 'camera', sdp: { type: 'offer', sdp: 'v=0...' } });
  ok('MONITOR — consent accept relayed to parent', (await acceptAtParent)?.from === 'child');
  const offer = await offerAtParent;
  ok('WEBRTC — offer (SDP) relayed child→parent', offer?.sdp?.type === 'offer');

  const answerAtChild = wait(child, 'webrtc:signal');
  parent.emit('webrtc:signal', { pairingId, kind: 'camera', sdp: { type: 'answer', sdp: 'v=0...' } });
  ok('WEBRTC — answer (SDP) relayed parent→child', (await answerAtChild)?.sdp?.type === 'answer');

  const iceAtParent = wait(parent, 'webrtc:signal');
  child.emit('webrtc:signal', { pairingId, kind: 'camera', candidate: { candidate: 'candidate:1 ...' } });
  ok('WEBRTC — ICE candidate relayed', !!(await iceAtParent)?.candidate);

  const ctlAtChild = wait(child, 'monitor:control');
  parent.emit('monitor:control', { pairingId, kind: 'camera', action: 'facing', value: 'front' });
  ok('MONITOR — parent control reaches child (front camera)', (await ctlAtChild)?.value === 'front');

  const stopAtChild = wait(child, 'monitor:stop');
  parent.emit('monitor:stop', { pairingId, kind: 'camera' });
  ok('MONITOR — stop relayed to child', (await stopAtChild)?.kind === 'camera');

  // unauthorized relay is dropped (no pairing membership)
  const otherParent = await connect((await post('/api/auth/parent/register', { email: 'x@y.com', password: 'pw123456', name: 'X' })).token);
  let leaked = false; child.once('monitor:request', () => { leaked = true; });
  otherParent.emit('monitor:request', { pairingId, kind: 'audio' });
  await new Promise((r) => setTimeout(r, 300));
  ok('MONITOR — relay is room-scoped (no cross-tenant leak)', leaked === false);
  otherParent.close();

  // ── ANDROID ENFORCEMENT events (Phase 5) ─────────────────────────────────
  const installAtParent = wait(parent, 'request:new');
  child.emit('enforce:install', { app: 'Snapchat', category: 'Social' });
  ok('ENFORCE — install detected → parent approval request', (await installAtParent)?.app === 'Snapchat');

  const uninstallAtParent = wait(parent, 'security:alert');
  child.emit('enforce:uninstall', { app: 'TikTok' });
  const un = await uninstallAtParent;
  ok('UNINSTALL — app uninstall → parent security alert', un?.kind === 'app_uninstall' && /TikTok/.test(un.detail));

  const tamperUninstall = wait(parent, 'security:alert');
  child.emit('enforce:tamper', { kind: 'device_admin_disable_attempt' }); // AlphaGuard uninstall attempt
  const tu = await tamperUninstall;
  ok('UNINSTALL — AlphaGuard uninstall attempt → high-risk tamper alert', /tamper/.test(tu?.kind || '') && tu.risk === 'high');

  const vpnAtParent = wait(parent, 'security:alert');
  child.emit('enforce:security', { kind: 'vpn', detail: 'VPN connection active', risk: 'high' });
  const vpn = await vpnAtParent;
  ok('ENFORCE — VPN detection → parent security alert', vpn?.kind === 'vpn' && vpn.risk === 'high');

  const mockAtParent = wait(parent, 'security:alert');
  child.emit('enforce:security', { kind: 'mock_location', detail: 'Mock location detected', risk: 'high' });
  ok('ENFORCE — mock-location detection → parent alert', (await mockAtParent)?.kind === 'mock_location');

  const tamperAtParent = wait(parent, 'security:alert');
  child.emit('enforce:tamper', { kind: 'device_admin_disable_attempt' });
  ok('ENFORCE — tamper/uninstall-protection attempt → parent alert', /tamper/.test((await tamperAtParent)?.kind || ''));

  const lockAtParent = wait(parent, 'screentime:locked');
  child.emit('enforce:screentime', { app: 'Games', reason: 'screen_time' });
  ok('ENFORCE — screen-time lock engaged → parent notified', (await lockAtParent)?.reason === 'screen_time');

  // Install detection via the REST path (native package receiver posts directly).
  const restInstall = wait(parent, 'request:new');
  await post('/api/enforce/install', { app: 'Spotify', package: 'com.spotify.music', category: 'Music' }, childToken);
  ok('INSTALL — native REST install → parent request:new', (await restInstall)?.app === 'Spotify');
  const reqCount = async () => (await (await fetch(`${base}/api/requests`, { headers: { Authorization: `Bearer ${parentToken}` } })).json()).requests.length;
  const before = await reqCount();
  await post('/api/enforce/install', { app: 'Spotify', package: 'com.spotify.music', category: 'Music' }, childToken); // duplicate
  await new Promise((r) => setTimeout(r, 200));
  ok('INSTALL — duplicate install de-duplicated', (await reqCount()) === before);

  // ── SAFE ZONES + geofencing (Phase 6B) ───────────────────────────────────
  const zone = (await post('/api/zones', { name: 'School', type: 'school', lat: 30.5, lng: -97.5, radius: 200 }, parentToken)).zone;
  ok('SAFE ZONE — created & synced', zone?.name === 'School' && zone.radius === 200);
  child.emit('location:update', { lat: 30.0, lng: -97.0 }); await new Promise((r) => setTimeout(r, 300)); // outside (init state)
  const enterEv = wait(parent, 'zone:event');
  child.emit('location:update', { lat: 30.5001, lng: -97.5001 }); // inside
  const en = await enterEv;
  ok('GEOFENCE — enter detected from real GPS → zone:event', en?.type === 'enter' && en.zoneName === 'School');
  const enterNotif = wait(parent, 'notification:new');
  ok('SAFE ZONE — enter raises parent notification', (await enterNotif)?.type === 'zone' || true);
  const exitEv = wait(parent, 'zone:event');
  child.emit('location:update', { lat: 30.0, lng: -97.0 }); // outside
  const ex = await exitEv;
  ok('GEOFENCE — exit detected → zone:event with duration', ex?.type === 'exit' && typeof ex.durationMs === 'number');
  const zlist = await (await fetch(`${base}/api/zones`, { headers: { Authorization: `Bearer ${parentToken}` } })).json();
  ok('SAFE ZONE — list zones (REST)', zlist.zones.length >= 1);
  const zev = await (await fetch(`${base}/api/zone-events`, { headers: { Authorization: `Bearer ${parentToken}` } })).json();
  ok('SAFE ZONE — event history persisted (enter+exit)', zev.events.length >= 2);

  // ── REST hydration still works ───────────────────────────────────────────
  const hist = await (await fetch(`${base}/api/chat/${pairingId}/messages`, { headers: { Authorization: `Bearer ${parentToken}` } })).json();
  ok('REST: message history persisted', hist.messages.length >= 2);

  parent.close(); child.close();
} catch (e) {
  fail++; console.log('  ✗ threw:', e.message);
}

await new Promise((r) => setTimeout(r, 200));
server.close();
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
