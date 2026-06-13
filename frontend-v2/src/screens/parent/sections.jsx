import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ensureSession } from '../../lib/session';
import { logout } from '../../lib/auth';
import { createViewer } from '../../lib/webrtc';
import { motion } from 'framer-motion';
import {
  MapPin, Navigation, Clock, Home, GraduationCap, Heart, Plus, Monitor, Camera, Mic, Lock, Unlock,
  FileText, Sparkles, ShieldCheck, Bell, Smartphone, User, KeyRound, Globe, Palette, ChevronRight, ChevronLeft,
  Check, Pause, Power, TrendingDown, TrendingUp, AlertTriangle, Send, Siren, Phone, BarChart3, Eye,
  HelpCircle, Mail, RotateCcw, LogOut, Trash2, Moon, Grid3x3, ChevronDown, Search, X,
  SwitchCamera, Flashlight, FlashlightOff, MicOff, Maximize, Minimize, Loader2, Square, Radio, Volume2, Wifi,
  ImageDown, Clock as ClockIcon,
} from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { useRealtime } from '../../context/RealtimeContext';
import { WEEK, SAFE_ZONES, fmtMins, activityDays } from '../../data/childDemo';
import { useI18n, useT } from '../../i18n/I18nContext';
import { LANGUAGES, LANG_BY_CODE } from '../../i18n/languages';

const fmt12 = (hhmm) => { let [h, m] = hhmm.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; };
const SEV = { low: { c: '#10b981', l: '' }, medium: { c: '#f59e0b', l: 'Medium' }, high: { c: '#ef4444', l: 'High' }, critical: { c: '#ef4444', l: 'Critical' } };
const TYPE_ICON = { app: Grid3x3, location: MapPin, screen: Clock, zone: ShieldCheck, emergency: Siren, system: Lock, install: Plus, uninstall: Trash2 };

const ICONS = { Home, GraduationCap, Heart };

const Page = ({ title, sub, right, back, children }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        {back && <button onClick={() => navigate(-1)} className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>}
        <div className="flex-1 min-w-0"><h1 className="text-[23px] font-black text-white tracking-tight leading-tight">{title}</h1>{sub && <p className="text-slate-500 text-[13px] font-semibold mt-0.5">{sub}</p>}</div>
        {right}
      </div>
      {children}
    </div>
  );
};
const Card = ({ children, className = '' }) => <div className={`rounded-[22px] border border-white/[0.07] bg-[#0b0c14] ${className}`}>{children}</div>;
const Label = ({ children }) => <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em] px-1">{children}</p>;
const Toggle = ({ on }) => <div className={`w-12 h-7 rounded-full flex items-center px-0.5 ${on ? 'bg-cyan-500/80 justify-end' : 'bg-white/10 justify-start'}`}><span className="w-6 h-6 rounded-full bg-white" /></div>;

/* ── Live Location ───────────────────────────────────────────────────────── */
export const LiveLocation = () => {
  const { child } = useChild();
  return (
    <Page title="Live Location" sub={`${child.name} · updated ${child.location.updated}`}>
      <Card className="relative overflow-hidden h-[260px] p-0">
        <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 45%, ${child.color}22, transparent 60%)` }} />
        <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
          <motion.div className="absolute -inset-8 rounded-full border" style={{ borderColor: `${child.color}55` }} animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2.6 }} />
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: `${child.color}33`, border: `2px solid ${child.color}`, boxShadow: `0 0 30px ${child.color}99` }}>{child.emoji}</div>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 p-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${child.safeZone.inside ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}><MapPin size={16} className={child.safeZone.inside ? 'text-emerald-400' : 'text-amber-400'} /></div>
          <div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px] truncate">{child.location.area}</p><p className="text-slate-400 text-[12px] font-semibold">{child.location.city} · {child.safeZone.inside ? 'Safe Zone' : 'Away'}</p></div>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <button className="ag-tap flex items-center justify-center gap-2 h-[52px] rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 font-bold text-[14px]"><Navigation size={17} /> Directions</button>
        <button className="ag-tap flex items-center justify-center gap-2 h-[52px] rounded-2xl bg-white/[0.05] border border-white/10 text-white font-bold text-[14px]"><Clock size={17} /> History</button>
      </div>
    </Page>
  );
};

/* ── Safe Zones ──────────────────────────────────────────────────────────── */
export const SafeZones = () => {
  const { child } = useChild();
  return (
    <Page title="Safe Zones" sub="Arrival & departure alerts" back right={<button className="ag-tap w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400"><Plus size={20} /></button>}>
      <div className="flex flex-col gap-3">
        {SAFE_ZONES.map((z) => { const I = ICONS[z.icon] || Home; const inside = z.name === child.safeZone.name && child.safeZone.inside; return (
          <Card key={z.id} className="flex items-center gap-3.5 p-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${z.accent}1f`, border: `1px solid ${z.accent}3a` }}><I size={21} style={{ color: z.accent }} /></div>
            <div className="flex-1 min-w-0"><p className="text-white font-black text-[15px]">{z.name}</p><p className="text-slate-500 text-[12.5px] font-semibold">{z.sub}</p></div>
            <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${inside ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.06] text-slate-400'}`}>{inside ? 'INSIDE' : 'AWAY'}</span>
          </Card>
        ); })}
      </div>
    </Page>
  );
};

/* ── Monitoring hub + members ────────────────────────────────────────────── */
export const MonitoringHub = () => {
  const navigate = useNavigate();
  const t = useT();
  const { child } = useChild();
  const { listCaptures } = useRealtime();
  const caps = listCaptures(child.id).slice(0, 8);
  const items = [
    { label: 'Camera', sub: 'Live camera · tap Start to connect', icon: Camera, to: '/app/monitoring/camera', accent: '#ef4444' },
    { label: 'Audio', sub: 'Live audio · tap Start to connect', icon: Mic, to: '/app/monitoring/audio', accent: '#a855f7' },
    { label: 'Screen View', sub: 'Live screen mirroring', icon: Monitor, to: '/app/monitoring/screen', accent: '#3b82f6' },
  ];
  return (
    <Page title={t('scr.monitoring')} sub={`Safety tools for ${child.name}`}>
      <div className="flex flex-col gap-3">
        {items.map((m) => (
          <button key={m.label} onClick={() => navigate(m.to)} aria-label={m.label} className="ag-tap flex items-center gap-4 p-4 rounded-[22px] border border-white/[0.08] bg-[#0b0c14] text-left">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${m.accent}1f`, border: `1px solid ${m.accent}3a` }}><m.icon size={22} style={{ color: m.accent }} /></div>
            <div className="flex-1 min-w-0"><p className="text-white font-black text-[16px]">{m.label}</p><p className="text-slate-400 text-[12.5px] font-semibold mt-0.5">{m.sub}</p></div>
            <ChevronRight size={18} className="text-slate-600" />
          </button>
        ))}
      </div>

      {/* Monitoring history — captures from camera & screen sessions */}
      <Label>Monitoring History</Label>
      {caps.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-8"><ImageDown size={24} className="text-slate-600" /><p className="text-slate-500 text-[12.5px] font-semibold">No captures yet</p><p className="text-slate-600 text-[11.5px] font-semibold text-center px-6">Use Capture in Camera or Screenshot in Screen View to save here.</p></Card>
      ) : (
        <Card className="divide-y divide-white/[0.05]">{caps.map((c) => (
          <div key={c.id} className="flex items-center gap-3.5 p-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${c.color}26`, border: `1px solid ${c.color}55` }}>{c.kind === 'screenshot' ? <Monitor size={18} style={{ color: c.color }} /> : <Camera size={18} style={{ color: c.color }} />}</div>
            <div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px] truncate">{c.source}</p><p className="text-slate-500 text-[12px] font-semibold truncate flex items-center gap-1"><MapPin size={11} /> {c.location} · {c.childName}</p></div>
            <div className="flex flex-col items-end flex-shrink-0"><span className="text-slate-500 text-[11px] font-bold">{c.time}</span><span className="text-slate-600 text-[10px] font-semibold">{c.date}</span></div>
          </div>
        ))}</Card>
      )}
      <p className="text-slate-500 text-[12px] font-semibold text-center px-4 leading-relaxed">Your child is always notified when monitoring tools are used.</p>
    </Page>
  );
};
/* ── Live monitoring sessions (WebRTC-ready) ─────────────────────────────── */
// Session state machine: connecting → live → ended (or error). A real signaling
// layer would drive these transitions; the timers here stand in for negotiation.
const fmtDur = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
// Real WebRTC viewer session (parent). Nothing connects until the parent taps
// Start; the child must accept before any stream flows.
// status: idle | connecting | requesting | accepted | live | declined | ended | offline | error
const useMonitorViewer = (kind) => {
  const [status, setStatus] = useState('idle');
  const [secs, setSecs] = useState(0);
  const [stream, setStream] = useState(null);
  const ref = useRef(null);
  const start = useCallback(async () => {
    setStatus('connecting'); setSecs(0); setStream(null);
    try {
      const { socket, pairingId } = await ensureSession('parent');
      ref.current = createViewer({ socket, pairingId, kind, onStream: setStream, onStatus: setStatus });
    } catch (e) { setStatus(e && e.message === 'server-unreachable' ? 'offline' : 'offline'); }
  }, [kind]);
  const stop = useCallback(() => { if (ref.current) ref.current.stop(); ref.current = null; setStream(null); setStatus('idle'); }, []);
  const control = useCallback((a, v) => ref.current && ref.current.control(a, v), []);
  useEffect(() => () => { if (ref.current) ref.current.stop(); }, []);
  useEffect(() => { if (status !== 'live') return; const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, [status]);
  return { status, secs, stream, start, stop, control };
};
const ConnState = ({ status, child, accent }) => {
  if (status === 'declined') return <p className="text-rose-300 text-[13px] font-bold text-center px-4">{child.name} declined the request</p>;
  if (status === 'offline') return <p className="text-amber-300 text-[12.5px] font-bold text-center px-5 leading-relaxed">Can’t reach the monitoring server. Start it with <span className="text-white">npm start</span> in backend-v2.</p>;
  if (status === 'ended') return null;
  return <p className="text-slate-300 text-[13px] font-bold text-center px-4">{status === 'accepted' ? `${child.name} accepted — starting stream…` : `Requesting access from ${child.name}…`}</p>;
};
const LiveDot = () => <span className="flex items-center gap-1.5 text-[10px] font-black px-2 py-1 rounded-full bg-rose-500/20 text-rose-300"><motion.span className="w-1.5 h-1.5 rounded-full bg-rose-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} /> LIVE</span>;
const MonitorBanner = ({ label }) => (
  <Card className="flex items-start gap-2.5 p-3.5 border-amber-500/20 bg-amber-500/[0.05]"><Eye size={15} className="text-amber-400 flex-shrink-0 mt-0.5" /><p className="text-[12px] text-slate-400 leading-relaxed font-medium">{label}</p></Card>
);
const Ctrl = ({ icon: I, label, active, danger, onClick }) => (
  <button onClick={onClick} aria-label={label} aria-pressed={!!active} className={`ag-tap flex flex-col items-center gap-1.5 flex-1 py-3 rounded-2xl border transition-colors ${danger ? 'border-rose-500/40 bg-rose-500/10' : active ? 'border-cyan-400/40 bg-cyan-500/15' : 'border-white/[0.08] bg-[#0b0c14] hover:bg-white/[0.04]'}`}>
    <I size={20} className={danger ? 'text-rose-400' : active ? 'text-cyan-300' : 'text-slate-300'} />
    <span className={`text-[10.5px] font-bold ${danger ? 'text-rose-400' : active ? 'text-cyan-300' : 'text-slate-400'}`}>{label}</span>
  </button>
);

export const CameraAccess = () => {
  const { child } = useChild();
  const { addCapture } = useRealtime();
  const { status, secs, stream, start, stop, control } = useMonitorViewer('camera');
  const [facing, setFacing] = useState('rear');
  const [flash, setFlash] = useState(false);
  const [muted, setMuted] = useState(false);
  const [full, setFull] = useState(false);
  const [flashFx, setFlashFx] = useState(false);
  const videoRef = useRef(null);
  const live = status === 'live';
  const idle = status === 'idle';
  const connecting = ['connecting', 'requesting', 'accepted'].includes(status);
  useEffect(() => { if (videoRef.current && stream) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); } }, [stream]);
  useEffect(() => { if (videoRef.current) videoRef.current.muted = muted; }, [muted, stream]);

  const setFace = (f) => { setFacing(f); control('facing', f); };
  const toggleFlash = () => { const v = !flash; setFlash(v); control('torch', v); };
  const capture = () => {
    const v = videoRef.current; if (!v || !v.videoWidth) return;
    const cv = document.createElement('canvas'); cv.width = v.videoWidth; cv.height = v.videoHeight;
    cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
    const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = `capture-${Date.now()}.png`; a.click();
    addCapture({ childId: child.id, childName: child.name, source: `${facing === 'front' ? 'Front' : 'Rear'} Camera`, kind: 'photo', location: child.location.area, color: child.color });
    setFlashFx(true); setTimeout(() => setFlashFx(false), 220);
  };

  const Stream = (
    <div className={`relative ${full ? 'fixed inset-0 z-[60] rounded-none' : 'h-[300px] rounded-[24px]'} overflow-hidden bg-black border border-white/10`}>
      <video ref={videoRef} autoPlay playsInline className={`absolute inset-0 w-full h-full ${full ? 'object-contain' : 'object-cover'} ${live ? '' : 'opacity-0'}`} />
      {flashFx && <div className="absolute inset-0 bg-white" style={{ opacity: 0.85 }} />}
      {idle && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"><div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-400/30 flex items-center justify-center"><Camera size={28} className="text-rose-400" /></div><p className="text-slate-400 text-[13px] font-semibold">Camera is off · tap Start below</p></div>}
      {connecting && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4"><Loader2 size={30} className="text-cyan-400 animate-spin" /><ConnState status={status} child={child} /></div>}
      {(status === 'declined' || status === 'offline') && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4"><AlertTriangle size={26} className="text-amber-400" /><ConnState status={status} child={child} /></div>}
      {status === 'ended' && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"><Camera size={26} className="text-slate-500" /><p className="text-slate-400 text-[13px] font-bold">Session ended</p></div>}
      {live && (
        <>
          <div className="absolute top-3 left-3"><LiveDot /></div>
          <div className="absolute top-3 right-3 text-[11px] font-black text-white/80 bg-black/40 px-2 py-1 rounded-full">{fmtDur(secs)}</div>
          <div className="absolute bottom-3 left-3 text-[11px] font-bold text-white/70 bg-black/40 px-2 py-1 rounded-full flex items-center gap-1.5"><Camera size={12} /> {facing === 'front' ? 'Front' : 'Rear'} · {muted ? 'Muted' : 'Audio on'}</div>
          {full && <button onClick={() => setFull(false)} aria-label="Exit fullscreen" className="ag-tap absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/50 border border-white/15 flex items-center justify-center"><Minimize size={18} className="text-white" /></button>}
        </>
      )}
    </div>
  );
  if (full) return Stream;

  return (
    <Page title="Camera" sub={`${child.name} · live camera`} back>
      {Stream}
      {idle ? (
        <button onClick={start} className="ag-tap w-full h-[56px] rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white font-extrabold flex items-center justify-center gap-2"><Camera size={18} /> Start Camera</button>
      ) : live ? (
        <>
          <div className="flex gap-2">
            <Ctrl icon={ImageDown} label="Capture" onClick={capture} />
            <Ctrl icon={SwitchCamera} label={facing === 'front' ? 'Front' : 'Rear'} active onClick={() => setFace(facing === 'front' ? 'rear' : 'front')} />
            <Ctrl icon={flash ? Flashlight : FlashlightOff} label="Flash" active={flash} onClick={toggleFlash} />
            <Ctrl icon={muted ? MicOff : Mic} label={muted ? 'Unmute' : 'Mute'} active={!muted} onClick={() => setMuted((v) => !v)} />
            <Ctrl icon={Maximize} label="Full" onClick={() => setFull(true)} />
          </div>
          <button onClick={stop} className="ag-tap w-full h-[56px] rounded-full bg-white/[0.05] border border-white/10 text-white font-bold flex items-center justify-center gap-2"><Square size={16} /> Stop Camera</button>
        </>
      ) : connecting ? (
        <button onClick={stop} className="ag-tap w-full h-[56px] rounded-full bg-white/[0.05] border border-white/10 text-white font-bold flex items-center justify-center gap-2"><X size={16} /> Cancel Request</button>
      ) : (
        <button onClick={start} className="ag-tap w-full h-[56px] rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white font-extrabold">{status === 'offline' ? 'Retry' : status === 'declined' ? 'Request Again' : 'Reconnect Camera'}</button>
      )}
      <MonitorBanner label={`${child.name} is notified: “Camera Monitoring Active.” Captures are saved to Monitoring History.`} />
    </Page>
  );
};

export const AudioMonitor = () => {
  const { child } = useChild();
  const { status, secs, stream, start, stop } = useMonitorViewer('audio');
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);
  const live = status === 'live';
  const idle = status === 'idle';
  const connecting = ['connecting', 'requesting', 'accepted'].includes(status);
  useEffect(() => { if (audioRef.current && stream) { audioRef.current.srcObject = stream; audioRef.current.play().catch(() => {}); } }, [stream]);
  useEffect(() => { if (audioRef.current) audioRef.current.muted = muted; }, [muted, stream]);
  return (
    <Page title="Audio" sub={`${child.name} · live audio`} back>
      <audio ref={audioRef} autoPlay className="hidden" />
      <Card className="h-[220px] flex flex-col items-center justify-center gap-4 relative px-5">
        {live && <div className="absolute top-3 left-3"><LiveDot /></div>}
        {live && <div className="absolute top-3 right-3 text-[11px] font-black text-white/70">{fmtDur(secs)}</div>}
        {idle && <><div className="w-16 h-16 rounded-3xl bg-violet-500/10 border border-violet-400/30 flex items-center justify-center"><Mic size={28} className="text-violet-400" /></div><p className="text-slate-400 text-[13px] font-semibold">Audio is off · tap Start below</p></>}
        {connecting && <><Loader2 size={28} className="text-violet-400 animate-spin" /><ConnState status={status} child={child} /></>}
        {(status === 'declined' || status === 'offline') && <><AlertTriangle size={26} className="text-amber-400" /><ConnState status={status} child={child} /></>}
        {status === 'ended' && <><Mic size={26} className="text-slate-500" /><p className="text-slate-400 text-[13px] font-bold">Session ended</p></>}
        {live && (
          <>
            <div className="flex items-end gap-1.5 h-16">{[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8].map((h, i) => (<motion.div key={i} className="w-2 rounded-full bg-violet-400/70" animate={{ height: muted ? '6px' : [`${h * 30}px`, `${h * 60}px`, `${h * 30}px`] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }} />))}</div>
            <p className="text-emerald-400 text-[12.5px] font-bold flex items-center gap-1.5"><Wifi size={13} /> Connected · Live audio</p>
          </>
        )}
      </Card>
      {live && (
        <div className="grid grid-cols-2 gap-2.5">
          <Ctrl icon={muted ? MicOff : Mic} label={muted ? 'Unmute' : 'Mute'} active={!muted} onClick={() => setMuted((v) => !v)} />
          <Ctrl icon={Radio} label="Signal" active onClick={() => {}} />
        </div>
      )}
      {idle ? (
        <button onClick={start} className="ag-tap w-full h-[56px] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-extrabold flex items-center justify-center gap-2"><Mic size={18} /> Start Audio Monitoring</button>
      ) : live ? (
        <button onClick={stop} className="ag-tap w-full h-[56px] rounded-full bg-white/[0.05] border border-white/10 text-white font-bold flex items-center justify-center gap-2"><Square size={16} /> Stop Monitoring</button>
      ) : connecting ? (
        <button onClick={stop} className="ag-tap w-full h-[56px] rounded-full bg-white/[0.05] border border-white/10 text-white font-bold flex items-center justify-center gap-2"><X size={16} /> Cancel Request</button>
      ) : (
        <button onClick={start} className="ag-tap w-full h-[56px] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-extrabold">{status === 'offline' ? 'Retry' : status === 'declined' ? 'Request Again' : 'Reconnect Audio'}</button>
      )}
      <MonitorBanner label={`${child.name} is notified: “Audio Monitoring Active.” Live audio is never recorded without disclosure.`} />
    </Page>
  );
};

export const ScreenView = () => {
  const { child } = useChild();
  const { addCapture } = useRealtime();
  const { status, secs, stream, start, stop } = useMonitorViewer('screen');
  const [full, setFull] = useState(false);
  const [flashFx, setFlashFx] = useState(false);
  const videoRef = useRef(null);
  const [res, setRes] = useState('');
  const live = status === 'live';
  const idle = status === 'idle';
  const connecting = ['connecting', 'requesting', 'accepted'].includes(status);
  useEffect(() => { if (videoRef.current && stream) { videoRef.current.srcObject = stream; videoRef.current.onloadedmetadata = () => { videoRef.current && setRes(`${videoRef.current.videoWidth}×${videoRef.current.videoHeight}`); }; videoRef.current.play().catch(() => {}); } }, [stream]);
  const shot = () => {
    const v = videoRef.current; if (!v || !v.videoWidth) return;
    const cv = document.createElement('canvas'); cv.width = v.videoWidth; cv.height = v.videoHeight;
    cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
    const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = `screen-${Date.now()}.png`; a.click();
    addCapture({ childId: child.id, childName: child.name, source: 'Screen View', kind: 'screenshot', location: child.location.area, color: child.color });
    setFlashFx(true); setTimeout(() => setFlashFx(false), 220);
  };

  const Screen = (
    <div className={`relative ${full ? 'fixed inset-0 z-[60]' : 'w-[160px] h-[320px] rounded-[30px] border-2 border-white/12'} overflow-hidden bg-[#05060c] flex items-center justify-center`}>
      <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-contain ${live ? '' : 'opacity-0'}`} />
      {flashFx && <div className="absolute inset-0 bg-white" style={{ opacity: 0.85 }} />}
      {idle && <div className="flex flex-col items-center gap-2.5"><div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center"><Monitor size={22} className="text-blue-400" /></div><p className="text-slate-400 text-[11px] font-bold text-center px-3">Screen is off</p></div>}
      {connecting && <div className="flex flex-col items-center gap-2.5 px-3"><Loader2 size={26} className="text-blue-400 animate-spin" /><p className="text-slate-300 text-[11px] font-bold text-center">{status === 'accepted' ? 'Starting…' : `Asking ${child.name}…`}</p></div>}
      {(status === 'declined' || status === 'offline') && <div className="flex flex-col items-center gap-2 px-3"><AlertTriangle size={22} className="text-amber-400" /><p className="text-amber-300 text-[11px] font-bold text-center">{status === 'offline' ? 'Server offline' : 'Declined'}</p></div>}
      {status === 'ended' && <div className="flex flex-col items-center gap-2.5"><Monitor size={24} className="text-slate-500" /><p className="text-slate-400 text-[11px] font-bold">Session ended</p></div>}
      {live && (
        <>
          <div className="absolute top-2 left-2"><LiveDot /></div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/70 bg-black/40 px-2 py-0.5 rounded-full">{fmtDur(secs)}</div>
        </>
      )}
    </div>
  );
  if (full) return (<div className="relative">{Screen}<button onClick={() => setFull(false)} aria-label="Exit fullscreen" className="ag-tap fixed bottom-6 right-6 z-[61] w-12 h-12 rounded-full bg-black/60 border border-white/15 flex items-center justify-center"><Minimize size={20} className="text-white" /></button></div>);

  return (
    <Page title="Screen View" sub={`${child.name} · live screen`} back>
      <div className="flex justify-center py-1">{Screen}</div>
      {live && (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            <Card className="p-3 text-center"><p className="text-slate-500 text-[10px] font-bold uppercase">Resolution</p><p className="text-white font-black text-[13px] mt-0.5">{res || '—'}</p></Card>
            <Card className="p-3 text-center"><p className="text-slate-500 text-[10px] font-bold uppercase">Quality</p><p className="text-cyan-300 font-black text-[13px] mt-0.5">Live</p></Card>
            <button onClick={() => setFull(true)} className="ag-tap rounded-[22px] border border-white/[0.07] bg-[#0b0c14] p-3 text-center flex flex-col items-center justify-center"><Maximize size={16} className="text-slate-300" /><p className="text-slate-400 text-[10px] font-bold mt-1">Fullscreen</p></button>
          </div>
          <button onClick={shot} className="ag-tap w-full h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold flex items-center justify-center gap-2"><ImageDown size={17} /> Screenshot</button>
        </>
      )}
      {idle ? (
        <button onClick={start} className="ag-tap w-full h-[56px] rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold flex items-center justify-center gap-2"><Monitor size={18} /> Start Screen View</button>
      ) : live ? (
        <button onClick={stop} className="ag-tap w-full h-[56px] rounded-full bg-white/[0.05] border border-white/10 text-white font-bold flex items-center justify-center gap-2"><Square size={16} /> Stop Viewing</button>
      ) : connecting ? (
        <button onClick={stop} className="ag-tap w-full h-[56px] rounded-full bg-white/[0.05] border border-white/10 text-white font-bold flex items-center justify-center gap-2"><X size={16} /> Cancel Request</button>
      ) : (
        <button onClick={start} className="ag-tap w-full h-[56px] rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold">{status === 'offline' ? 'Retry' : status === 'declined' ? 'Request Again' : 'Reconnect Screen'}</button>
      )}
      <MonitorBanner label={`${child.name} is notified: “Screen Monitoring Active.” Screenshots are saved to Monitoring History.`} />
    </Page>
  );
};

/* ── Controls ────────────────────────────────────────────────────────────── */
export const Controls = () => {
  const navigate = useNavigate();
  const t = useT();
  const { child, setting } = useChild();
  const [s, setS] = useState({ safe: true });
  const tog = (k) => setS({ ...s, [k]: !s[k] });
  const centers = [
    { label: 'Screen Time', icon: Clock, to: '/app/screen-time', accent: '#06b6d4' },
    { label: 'Night Mode', icon: Moon, to: '/app/night', accent: '#6366f1' },
    { label: 'App Management', icon: BarChart3, to: '/app/app-management', accent: '#3b82f6' },
    { label: 'Safe Zones', icon: MapPin, to: '/app/safe-zones', accent: '#10b981' },
  ];
  return (
    <Page title={t('scr.controls')} sub={`Manage ${child.name}'s device`}>
      <div className="grid grid-cols-2 gap-2.5">
        {centers.map((c) => (
          <button key={c.label} onClick={() => navigate(c.to)} className="ag-tap flex items-center gap-2.5 p-3.5 rounded-2xl border border-white/[0.08] bg-[#0b0c14]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${c.accent}1f`, border: `1px solid ${c.accent}3a` }}><c.icon size={17} style={{ color: c.accent }} /></div>
            <span className="text-white font-bold text-[13px] leading-tight">{c.label}</span>
          </button>
        ))}
      </div>
      {/* Night Restriction — shows the active schedule, opens the Night center */}
      <button onClick={() => navigate('/app/night')} className="ag-tap w-full flex items-center gap-3 p-4 rounded-2xl border border-white/[0.08] bg-[#0b0c14] text-left">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center"><Moon size={18} className="text-indigo-300" /></div>
        <div className="flex-1 min-w-0"><p className="text-white font-bold text-[14px]">Night Restriction</p><p className="text-slate-500 text-[12px] font-semibold">{setting.night.on ? `${fmt12(setting.night.start)} → ${fmt12(setting.night.end)}` : 'Disabled'}</p></div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${setting.night.on ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.06] text-slate-400'}`}>{setting.night.on ? 'ON' : 'OFF'}</span>
        <ChevronRight size={16} className="text-slate-600" />
      </button>

      <Card className="flex items-center gap-3 p-4"><ShieldCheck size={18} className="text-cyan-400" /><div className="flex-1"><p className="text-white font-bold text-[14px]">Safe Search</p><p className="text-slate-500 text-[12px] font-semibold">Filter explicit content</p></div><button onClick={() => tog('safe')}><Toggle on={s.safe} /></button></Card>

      {/* Daily limit — opens the adjustable slider */}
      <button onClick={() => navigate('/app/screen-time')} className="ag-tap w-full text-left p-4 rounded-2xl border border-white/[0.08] bg-[#0b0c14]">
        <div className="flex items-center justify-between mb-2"><p className="text-white font-bold text-[14px]">Daily Time Limit</p><span className="text-cyan-400 font-black text-[14px]">{fmtMins(setting.screenLimit)}</span></div>
        <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(100, (child.screenTime.today / setting.screenLimit) * 100)}%` }} /></div>
        <p className="text-slate-500 text-[11.5px] font-semibold mt-2">{fmtMins(child.screenTime.today)} used today · tap to adjust</p>
      </button>
      <p className="text-slate-500 text-[12px] font-semibold text-center px-4">Sensitive actions require your Parent Security PIN.</p>
    </Page>
  );
};

/* ── App Controls ────────────────────────────────────────────────────────── */
export const AppControls = () => {
  const { child } = useChild();
  const [locked, setLocked] = useState({});
  return (
    <Page title="App Controls" sub={`${child.name}'s apps today`} back>
      <div className="flex flex-col gap-3">
        {child.topApps.map((a) => (
          <Card key={a.name} className="flex items-center gap-3.5 p-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white" style={{ background: a.color }}>{a.name[0]}</div>
            <div className="flex-1 min-w-0"><p className="text-white font-bold text-[14.5px]">{a.name}</p><p className="text-slate-500 text-[12px] font-semibold">{fmtMins(a.mins)} today</p></div>
            <button onClick={() => setLocked({ ...locked, [a.name]: !locked[a.name] })} className={`ag-tap w-12 h-7 rounded-full flex items-center px-0.5 ${locked[a.name] ? 'bg-rose-500/80 justify-end' : 'bg-white/10 justify-start'}`}><span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">{locked[a.name] ? <Lock size={12} className="text-rose-500" /> : <Unlock size={12} className="text-slate-400" />}</span></button>
          </Card>
        ))}
      </div>
    </Page>
  );
};

/* ── Analytics + Reports ─────────────────────────────────────────────────── */
const Bars = () => { const max = Math.max(...WEEK.map((w) => w.mins)); return (
  <div className="flex items-end justify-between gap-2 h-[140px]">{WEEK.map((w, i) => (<div key={i} className="flex-1 flex flex-col items-center gap-2"><motion.div className="w-full rounded-lg" style={{ background: i === 5 ? '#06b6d4' : 'rgba(255,255,255,0.12)' }} initial={{ height: 0 }} animate={{ height: `${(w.mins / max) * 110}px` }} transition={{ delay: i * 0.06, duration: 0.5 }} /><span className="text-[11px] font-bold text-slate-500">{w.d}</span></div>))}</div>
); };
export const Analytics = () => {
  const { child } = useChild();
  return (
    <Page title="Analytics" sub={`${child.name} · this week`}>
      <Card className="p-5"><p className="text-slate-400 text-[12px] font-bold uppercase mb-3">Screen time</p><Bars /></Card>
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3.5"><p className="text-slate-500 text-[10px] font-bold uppercase">Avg/day</p><p className="text-white font-black text-[17px] mt-1">3h 18m</p></Card>
        <Card className="p-3.5"><p className="text-slate-500 text-[10px] font-bold uppercase">Top app</p><p className="text-white font-black text-[17px] mt-1 truncate">{child.topApps[0].name}</p></Card>
        <Card className="p-3.5"><p className="text-slate-500 text-[10px] font-bold uppercase">Trend</p><p className="font-black text-[17px] mt-1 flex items-center gap-1" style={{ color: child.trend <= 0 ? '#10b981' : '#ef4444' }}>{child.trend <= 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />} {Math.abs(child.trend)}%</p></Card>
      </div>
    </Page>
  );
};
export const WeeklyReports = () => (
  <Page title="Reports" sub="Weekly & daily summaries">
    <Card className="p-5"><Bars /></Card>
    <button className="ag-tap w-full h-[52px] rounded-2xl bg-white/[0.05] border border-white/10 text-white font-bold flex items-center justify-center gap-2"><FileText size={17} /> Download PDF Report</button>
  </Page>
);
export const DailyReports = () => { const { child } = useChild(); return (
  <Page title="Daily Report" sub="Today at a glance" back><Card className="p-5 flex flex-col gap-3">{child.topApps.map((a) => (<div key={a.name} className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} /><span className="flex-1 text-white font-semibold text-[13.5px]">{a.name}</span><span className="text-slate-400 font-bold text-[13px]">{fmtMins(a.mins)}</span></div>))}</Card></Page>
); };

/* ── AI Insights ─────────────────────────────────────────────────────────── */
export const AIInsights = () => {
  const { child } = useChild();
  const C = 2 * Math.PI * 40;
  return (
    <Page title="AI Insights" sub={`Powered by DISHA · ${child.name}`}>
      <Card className="p-6 flex flex-col items-center">
        <div className="relative w-[110px] h-[110px]"><svg width="110" height="110" className="-rotate-90"><circle cx="55" cy="55" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="9" fill="none" /><motion.circle cx="55" cy="55" r="40" stroke="#10b981" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - child.safetyScore / 100) }} transition={{ duration: 1.3 }} /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-white font-black text-[26px] leading-none">{child.safetyScore}</span><span className="text-slate-500 text-[10px] font-bold uppercase">Wellbeing</span></div></div>
        <p className="font-black text-[15px] mt-3" style={{ color: child.risk === 'Low' ? '#10b981' : '#f59e0b' }}>{child.risk} risk</p>
      </Card>
      {child.recommendations.map((r, i) => (<Card key={i} className="flex items-start gap-3.5 p-4"><div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${r.accent}1f` }}><Sparkles size={18} style={{ color: r.accent }} /></div><p className="text-slate-300 text-[13px] font-medium leading-relaxed">{r.text}</p></Card>))}
    </Page>
  );
};

/* ── Activity Feed ───────────────────────────────────────────────────────── */
export const ActivityHistory = () => {
  const t = useT();
  const { child } = useChild();
  const { liveActivity } = useRealtime();
  // Live events (e.g. app uninstalls, tamper attempts) are prepended into Today.
  const live = liveActivity(child.id);
  const baseDays = activityDays(child);
  const days = live.length ? baseDays.map((d, i) => (i === 0 ? { ...d, events: [...live, ...d.events] } : d)) : baseDays;
  const [open, setOpen] = useState({ 0: true }); // Today expanded by default
  return (
    <Page title={t('scr.activity')} sub={`${child.name}'s full history`}>
      {days.map((d, i) => {
        const isOpen = !!open[i];
        return (
          <div key={i} className="flex flex-col gap-2">
            <button onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))} className="ag-tap w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#0b0c14] border border-white/[0.07]">
              <div className="text-left"><p className="text-white font-black text-[14px]">{d.label}</p><p className="text-slate-500 text-[11.5px] font-semibold">{d.date}</p></div>
              <div className="flex items-center gap-2.5"><span className="text-[11px] font-bold text-slate-500">{d.events.length} events</span><ChevronDown size={18} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></div>
            </button>
            {isOpen && (
              <Card className="divide-y divide-white/[0.05]">
                {d.events.map((e) => { const I = TYPE_ICON[e.type] || ShieldCheck; const s = SEV[e.sev] || SEV.low; return (
                  <div key={e.id} className="flex items-center gap-3 p-3.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.c}1f` }}><I size={16} style={{ color: s.c }} /></div>
                    <div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px] truncate">{e.title}</p>{e.sub && <p className="text-slate-500 text-[12px] font-semibold truncate">{e.sub}</p>}</div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0"><span className="text-slate-600 text-[11px] font-bold">{e.time}</span>{s.l && <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: `${s.c}1f`, color: s.c }}>{s.l.toUpperCase()}</span>}</div>
                  </div>
                ); })}
              </Card>
            )}
          </div>
        );
      })}
    </Page>
  );
};

/* ── Emergency Center ────────────────────────────────────────────────────── */
export const EmergencyCenter = () => {
  const { child } = useChild();
  return (
    <Page title="Emergency Center" sub={`${child.name} · ${child.emergency.status}`}>
      <Card className={`flex items-center gap-3.5 p-4 ${child.emergency.ok ? '' : 'border-rose-500/30'}`}><div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${child.emergency.ok ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}><Siren size={20} className={child.emergency.ok ? 'text-emerald-400' : 'text-rose-400'} /></div><div className="flex-1"><p className="text-white font-bold text-[14px]">Current Status</p><p className={`text-[12.5px] font-semibold ${child.emergency.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{child.emergency.status}</p></div></Card>
      <button className="ag-tap w-full overflow-hidden rounded-[24px] border border-rose-500/30 bg-gradient-to-r from-rose-600/20 to-red-600/10 p-5 flex items-center gap-4"><div className="relative"><motion.div className="absolute -inset-2 rounded-full bg-rose-500/30 blur-md" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 1.8 }} /><div className="relative w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center"><Siren size={24} className="text-rose-400" /></div></div><div className="flex-1 text-left"><p className="text-white font-black text-[16px]">Trigger SOS Alert</p><p className="text-rose-200/70 text-[12.5px] font-semibold">Notify all guardians instantly</p></div></button>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] px-1">Emergency Contacts</p>
      {[{ n: 'Jane (Mom)', p: 'Primary guardian' }, { n: 'Emergency Services', p: '911' }].map((c) => (<Card key={c.n} className="flex items-center gap-3.5 p-4"><div className="w-10 h-10 rounded-2xl bg-cyan-500/15 flex items-center justify-center"><Phone size={18} className="text-cyan-400" /></div><div className="flex-1"><p className="text-white font-bold text-[14px]">{c.n}</p><p className="text-slate-500 text-[12px] font-semibold">{c.p}</p></div></Card>))}
    </Page>
  );
};

/* ── Device Management ───────────────────────────────────────────────────── */
export const DeviceManagement = () => {
  const { child } = useChild();
  return (
    <Page title="Connected Devices" sub="Manage devices" back>
      <Card className="p-5 flex items-center gap-3.5"><div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center"><Smartphone size={22} className="text-cyan-400" /></div><div className="flex-1"><p className="text-white font-black text-[15px]">{child.name}'s {child.device}</p><p className={`text-[12px] font-bold ${child.online ? 'text-emerald-400' : 'text-slate-500'}`}>● {child.online ? 'Online' : 'Offline'} · {child.battery}%</p></div></Card>
      <button className="ag-tap w-full h-[52px] rounded-2xl bg-rose-500/10 border border-rose-400/20 text-rose-400 font-bold flex items-center justify-center gap-2"><Power size={17} /> Disconnect Device</button>
    </Page>
  );
};

/* ── Settings hub + pages ────────────────────────────────────────────────── */
const SETTINGS = [
  { label: 'Profile', icon: User, to: '/app/settings/profile', accent: '#06b6d4' },
  { label: 'Security', icon: KeyRound, to: '/app/settings/security', accent: '#3b82f6' },
  { label: 'Notifications', icon: Bell, to: '/app/settings/notifications', accent: '#f59e0b' },
  { label: 'Language', icon: Globe, to: '/app/settings/language', accent: '#a855f7' },
  { label: 'Appearance', icon: Palette, to: '/app/settings/appearance', accent: '#ec4899' },
  { label: 'Connected Devices', icon: Smartphone, to: '/app/settings/devices', accent: '#10b981' },
  { label: 'Privacy Policy', icon: ShieldCheck, to: '/app/settings/privacy', accent: '#64748b' },
  { label: 'Help & Support', icon: HelpCircle, to: '/app/settings/help', accent: '#64748b' },
  { label: 'Contact Us', icon: Mail, to: '/app/settings/contact', accent: '#64748b' },
];
export const SettingsHub = () => {
  const navigate = useNavigate();
  return (
    <Page title="Settings">
      <Card className="p-4 flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xl">J</div><div><p className="text-white font-black text-[16px]">Jane Doe</p><p className="text-slate-500 text-[12.5px] font-semibold">jane@family.com</p></div></Card>
      <Card className="divide-y divide-white/[0.05]">
        {SETTINGS.map((m) => (<button key={m.label} onClick={() => navigate(m.to)} className="ag-tap w-full flex items-center gap-3.5 p-3.5"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${m.accent}1f` }}><m.icon size={17} style={{ color: m.accent }} /></div><span className="flex-1 text-left text-white font-bold text-[14px]">{m.label}</span><ChevronRight size={17} className="text-slate-600" /></button>))}
      </Card>
      <Card className="divide-y divide-white/[0.05]">
        <button className="ag-tap w-full flex items-center gap-3.5 p-3.5"><div className="w-9 h-9 rounded-xl bg-slate-500/15 flex items-center justify-center"><RotateCcw size={17} className="text-slate-300" /></div><span className="flex-1 text-left text-white font-bold text-[14px]">Reset Settings</span></button>
        <button onClick={() => { logout(); navigate('/welcome'); }} className="ag-tap w-full flex items-center gap-3.5 p-3.5"><div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center"><LogOut size={17} className="text-amber-400" /></div><span className="flex-1 text-left text-amber-400 font-bold text-[14px]">Sign Out</span></button>
        <button onClick={() => navigate('/app/settings/delete')} className="ag-tap w-full flex items-center gap-3.5 p-3.5"><div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center"><Trash2 size={17} className="text-rose-400" /></div><span className="flex-1 text-left text-rose-400 font-bold text-[14px]">Delete Account</span></button>
      </Card>
    </Page>
  );
};
const loadProfile = () => { try { return { name: 'Jane Doe', email: 'jane@family.com', phone: '+1 512-555-0100', photo: '', ...JSON.parse(localStorage.getItem('ag_profile') || '{}') }; } catch { return { name: 'Jane Doe', email: 'jane@family.com', phone: '+1 512-555-0100', photo: '' }; } };
export const Profile = () => {
  const navigate = useNavigate();
  const [p, setP] = useState(loadProfile);
  const [saved, setSaved] = useState(false);
  const set = (k, v) => { setP((x) => ({ ...x, [k]: v })); setSaved(false); };
  const onPhoto = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => set('photo', r.result); r.readAsDataURL(f); };
  const save = () => { localStorage.setItem('ag_profile', JSON.stringify(p)); setSaved(true); setTimeout(() => setSaved(false), 2200); };
  const initial = (p.name || 'J').trim()[0]?.toUpperCase() || 'J';
  const Field = ({ label, k, type = 'text', placeholder }) => (
    <div className="flex flex-col gap-1.5"><label className="text-slate-500 text-[11px] font-bold uppercase tracking-wide px-1">{label}</label><input type={type} value={p[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} className="h-12 rounded-2xl bg-[#0b0c14] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 focus:border-cyan-400/40 outline-none" /></div>
  );
  return (
    <Page title="Profile" sub="Edit your account details" back>
      <Card className="p-5 flex items-center gap-4">
        <label className="ag-tap relative cursor-pointer">
          {p.photo ? <img src={p.photo} alt="" className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl">{initial}</div>}
          <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center border-2 border-[#0b0c14]"><Camera size={12} className="text-[#030307]" /></span>
          <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
        </label>
        <div className="flex-1 min-w-0"><p className="text-white font-black text-[18px] truncate">{p.name}</p><p className="text-slate-500 text-[13px] font-semibold truncate">{p.email}</p><span className="inline-block mt-1.5 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">PARENT</span></div>
      </Card>

      <div className="flex flex-col gap-3">
        <Field label="Full Name" k="name" placeholder="Your name" />
        <Field label="Email" k="email" type="email" placeholder="you@family.com" />
        <Field label="Phone Number" k="phone" type="tel" placeholder="+1 …" />
      </div>

      <button onClick={save} className="ag-tap w-full h-[54px] rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-[#030307] font-extrabold flex items-center justify-center gap-2">{saved ? <><Check size={18} /> Saved</> : 'Save Changes'}</button>

      <Card className="divide-y divide-white/[0.05]">
        <button onClick={() => navigate('/forgot')} className="ag-tap w-full flex items-center gap-3.5 p-4"><div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center"><KeyRound size={17} className="text-amber-400" /></div><div className="flex-1 text-left"><p className="text-white font-bold text-[14px]">Change Login Password</p><p className="text-slate-500 text-[12px] font-semibold">Reset via email verification</p></div><ChevronRight size={17} className="text-slate-600" /></button>
      </Card>
    </Page>
  );
};
export const SecuritySettings = () => (
  <Page title="Security" sub="Protect your controls" back>
    <Card className="p-5 flex items-center gap-3.5"><div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center"><KeyRound size={22} className="text-cyan-400" /></div><div className="flex-1"><p className="text-white font-black text-[15px]">Parent Security PIN</p><p className="text-slate-500 text-[12.5px] font-semibold">Last changed 2 days ago</p></div><button className="ag-tap text-cyan-400 font-bold text-[13px]">Change</button></Card>
    {[{ t: 'Uninstall Protection', on: true }, { t: 'Biometric Unlock', on: true }, { t: 'Login Alerts', on: false }].map((r) => (<Card key={r.t} className="flex items-center gap-3 p-4"><ShieldCheck size={18} className="text-cyan-400" /><span className="flex-1 text-white font-bold text-[14px]">{r.t}</span><Toggle on={r.on} /></Card>))}
  </Page>
);
export const NotificationSettings = () => (
  <Page title="Notifications" sub="Choose what alerts you" back>
    {['Location alerts', 'Screen-time limits', 'App installs', 'Emergency SOS', 'Weekly reports'].map((t, i) => (<Card key={t} className="flex items-center gap-3 p-4"><Bell size={18} className="text-amber-400" /><span className="flex-1 text-white font-bold text-[14px]">{t}</span><Toggle on={i !== 2} /></Card>))}
  </Page>
);
export const Appearance = () => {
  const [t, setT] = useState('dark');
  return (
    <Page title="Appearance" sub="Theme & display" back>
      <div className="grid grid-cols-2 gap-3">
        {[{ id: 'dark', label: 'Dark', bg: '#0b0c14' }, { id: 'midnight', label: 'Midnight', bg: '#02030a' }].map((o) => (
          <button key={o.id} onClick={() => setT(o.id)} className={`ag-tap rounded-2xl border p-4 ${t === o.id ? 'border-cyan-400/50' : 'border-white/[0.08]'}`}><div className="h-16 rounded-xl mb-3 border border-white/10" style={{ background: o.bg }} /><div className="flex items-center justify-between"><span className="text-white font-bold text-[13px]">{o.label}</span>{t === o.id && <Check size={16} className="text-cyan-400" />}</div></button>
        ))}
      </div>
      <p className="text-slate-500 text-[12px] font-semibold text-center">Dark theme is optimized for night-time safety checks.</p>
    </Page>
  );
};
export const LanguageSettings = () => {
  const { lang, pref, isSystem, recent, setLang, t } = useI18n();
  const [q, setQ] = useState('');
  const current = LANG_BY_CODE[lang] || LANG_BY_CODE.en;
  const ql = q.trim().toLowerCase();
  const filtered = LANGUAGES.filter((l) => !ql || l.name.toLowerCase().includes(ql) || l.native.toLowerCase().includes(ql) || l.code.toLowerCase().includes(ql));
  const recentLangs = recent.map((c) => LANG_BY_CODE[c]).filter(Boolean);

  const LangRow = ({ l, selected }) => (
    <button onClick={() => setLang(l.code)} aria-label={`Set language to ${l.name}`} className="ag-tap w-full flex items-center gap-3 p-4 text-left">
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-[14.5px]">{l.name}</p>
        {l.native !== l.name && <p className="text-slate-500 text-[12.5px] font-semibold" dir={l.rtl ? 'rtl' : 'ltr'}>{l.native}</p>}
      </div>
      {l.rtl && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">RTL</span>}
      {selected && <span className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0"><Check size={14} className="text-[#030307]" strokeWidth={3.5} /></span>}
    </button>
  );

  return (
    <Page title={t('lang.title')} sub={`${current.name} · ${LANGUAGES.length} languages`} back>
      {/* Current language badge */}
      <Card className="p-4 flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center"><Globe size={22} className="text-cyan-400" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wide">{t('lang.current')}</p>
          <p className="text-white font-black text-[16px]">{current.name} <span className="text-slate-500 font-bold text-[13px]">· {current.native}</span></p>
        </div>
        {isSystem && <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400">AUTO</span>}
      </Card>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('lang.searchPlaceholder')} aria-label="Search language" className="w-full h-11 rounded-2xl bg-[#0b0c14] border border-white/10 pl-10 pr-9 text-[14px] text-white placeholder:text-slate-600 focus:border-cyan-400/40 outline-none" />
        {q && <button onClick={() => setQ('')} aria-label="Clear search" className="ag-tap absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"><X size={15} /></button>}
      </div>

      {!ql && (
        <>
          {/* System default */}
          <Label>{t('lang.systemDefault')}</Label>
          <Card>
            <button onClick={() => setLang('system')} className="ag-tap w-full flex items-center gap-3 p-4 text-left">
              <div className="flex-1"><p className="text-white font-bold text-[14.5px]">{t('lang.systemDefault')}</p><p className="text-slate-500 text-[12.5px] font-semibold">Match device language</p></div>
              {isSystem && <span className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center"><Check size={14} className="text-[#030307]" strokeWidth={3.5} /></span>}
            </button>
          </Card>

          {/* Recently used */}
          {recentLangs.length > 0 && (
            <>
              <Label>{t('lang.recentlyUsed')}</Label>
              <Card className="divide-y divide-white/[0.05]">{recentLangs.map((l) => <LangRow key={l.code} l={l} selected={!isSystem && l.code === lang} />)}</Card>
            </>
          )}
        </>
      )}

      {/* All languages (English names) */}
      <Label>{ql ? `${filtered.length} results` : t('lang.allLanguages')}</Label>
      {filtered.length === 0 ? (
        <Card className="p-6 text-center text-slate-500 text-[13px] font-semibold">{t('lang.noResults')}</Card>
      ) : (
        <Card className="divide-y divide-white/[0.05]">{filtered.map((l) => <LangRow key={l.code} l={l} selected={!isSystem && l.code === lang} />)}</Card>
      )}
    </Page>
  );
};
const INFO = {
  '/app/settings/privacy': { title: 'Privacy Policy', body: 'Your family’s data is encrypted in transit and at rest, never sold, and used only to deliver safety features you enable. You control what is shared and can revoke access at any time.' },
  '/app/settings/help': { title: 'Help & Support', body: 'Browse setup guides, troubleshooting, and safety best-practices. Our support team is available 24/7 for account and protection questions.' },
  '/app/settings/contact': { title: 'Contact Us', body: 'Reach the AlphaGuard AI team at support@alphaguard.ai. We typically respond within a few hours.' },
};
export const InfoPage = () => {
  const path = useLocation().pathname;
  const info = INFO[path] || { title: 'Info', body: '' };
  return (<Page title={info.title} back><Card className="p-5"><p className="text-slate-300 text-[14px] font-medium leading-relaxed">{info.body}</p></Card></Page>);
};

/* ── Disha full page ─────────────────────────────────────────────────────── */
export const DishaAI = () => {
  const { child } = useChild();
  return (
    <Page title="DISHA" sub="AI Family Assistant" back>
      <div className="flex flex-col gap-3">
        <div className="self-start max-w-[85%] bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 text-[13.5px] text-slate-200 leading-relaxed">Hi Jane 👋 {child.name} is {child.online ? 'online' : 'offline'} and {child.risk.toLowerCase()} risk today. How can I help?</div>
      </div>
      <div className="flex items-center gap-2 px-4 h-[54px] rounded-full bg-[#11131d] border border-white/10 mt-2"><input placeholder="Ask DISHA anything…" className="flex-1 bg-transparent outline-none text-white text-[15px] placeholder-slate-600" /><button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(140deg,#a855f7,#6366f1)' }}><Send size={16} className="text-white" /></button></div>
    </Page>
  );
};
