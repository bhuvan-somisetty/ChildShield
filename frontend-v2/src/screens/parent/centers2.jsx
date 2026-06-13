import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Navigation, Share2, Route, MapPin, ChevronLeft, Footprints, Car, Bike, Pause, Layers,
  Siren, Phone, Hospital, Shield, Clock, BatteryMedium, Wifi, ChevronRight, ChevronDown, AlertTriangle,
  Sparkles, TrendingDown, TrendingUp, Moon, GraduationCap, Send, Bell, Mail, Volume2, MessageCircle, FileText, Check, Mic,
} from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { useRealtime } from '../../context/RealtimeContext';
import { PARENT_LOC, NEARBY, RADAR, EMERGENCY, COPILOT, fmtMins } from '../../data/childDemo';
import { speak } from '../../voice/speech';
import { sosAnnouncement } from '../../voice/conversation';
import { distMeters } from '../../lib/zones';
import RadarMap from '../../components/parent/RadarMap';

const zoneRadiusLabel = (m) => (m >= 1000 ? `${m / 1000}km` : `${m}m`);

// Haversine distance in km between [lng,lat] points.
const haversine = (a, b) => {
  const R = 6371, toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(b[1] - a[1]), dLng = toR(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[1])) * Math.cos(toR(b[1])) * Math.sin(dLng / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))).toFixed(1);
};

const Page = ({ title, sub, right, back = true, children }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        {back && <button onClick={() => navigate(-1)} className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>}
        <div className="flex-1 min-w-0"><h1 className="text-[22px] font-black text-white tracking-tight leading-tight">{title}</h1>{sub && <p className="text-slate-500 text-[13px] font-semibold mt-0.5">{sub}</p>}</div>
        {right}
      </div>
      {children}
    </div>
  );
};
const Card = ({ children, className = '' }) => <div className={`rounded-[22px] border border-white/[0.07] bg-[#0b0c14] ${className}`}>{children}</div>;
const Label = ({ children }) => <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em] px-1">{children}</p>;
const Toggle = ({ on, onClick }) => <button onClick={onClick} className={`ag-tap w-12 h-7 rounded-full flex items-center px-0.5 ${on ? 'bg-cyan-500/80 justify-end' : 'bg-white/10 justify-start'}`}><span className="w-6 h-6 rounded-full bg-white" /></button>;
const MOVE = { Walking: Footprints, Driving: Car, Cycling: Bike, 'Not moving': Pause };

const PARENT_DEFAULT = [-97.7431, 30.2672]; // [lng,lat] fallback if geolocation denied
const openUrl = (u) => window.open(u, '_blank', 'noopener');

/* Real nearby police stations around the child (OpenStreetMap Overpass API). */
const NearbyPolice = ({ coord, area }) => {
  const [list, setList] = useState(null); // null = loading
  useEffect(() => {
    let on = true;
    const q = `[out:json][timeout:25];(node["amenity"="police"](around:12000,${coord[0]},${coord[1]});way["amenity"="police"](around:12000,${coord[0]},${coord[1]}););out center 8;`;
    fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) })
      .then((r) => r.json())
      .then((d) => {
        if (!on) return;
        const all = (d.elements || []).map((e) => {
          const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
          return { name: e.tags?.name || 'Police Station', phone: e.tags?.phone || e.tags?.['contact:phone'] || '', lat, lon, dist: lat ? haversine([coord[1], coord[0]], [lon, lat]) : 999 };
        }).filter((x) => x.lat).sort((a, b) => a.dist - b.dist);
        // Prefer stations that actually list a phone number; otherwise show the nearest.
        const withPhone = all.filter((x) => x.phone).slice(0, 2);
        setList(withPhone.length ? withPhone : all.slice(0, 2));
      })
      .catch(() => on && setList([]));
    return () => { on = false; };
  }, [coord[0], coord[1]]);

  const rows = list === null ? null : (list.length ? list : NEARBY.police.map((p) => ({ name: p.name, phone: p.phone, dist: p.dist, lat: null, lon: null })));
  const fmtD = (d) => (typeof d === 'number' ? (d < 1 ? `${Math.round(d * 1000)} m` : `${d} km`) : d);

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em] px-1">Nearest Police · near {area}</p>
      {rows === null ? (
        <Card className="p-4 flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center"><Shield size={17} className="text-blue-400" /></div><span className="text-slate-400 text-[13px] font-semibold">Finding nearby police stations…</span></Card>
      ) : rows.map((s, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center flex-shrink-0"><Shield size={18} className="text-blue-400" /></div>
            <div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px] truncate">{s.name}</p><p className="text-slate-500 text-[12px] font-semibold truncate">{fmtD(s.dist)} away{s.phone ? ` · ${s.phone}` : ''}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {s.phone
              ? <a href={`tel:${s.phone.replace(/[^\d+]/g, '')}`} className="ag-tap flex items-center justify-center gap-1.5 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 font-bold text-[12.5px]"><Phone size={14} /> Call station</a>
              : <a href="tel:911" className="ag-tap flex items-center justify-center gap-1.5 h-10 rounded-xl bg-rose-500/15 text-rose-300 font-bold text-[12.5px]"><Phone size={14} /> Call 911</a>}
            <button onClick={() => openUrl(s.lat ? `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + ' ' + area)}`)} className="ag-tap flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white/[0.05] border border-white/10 text-white font-bold text-[12.5px]"><Navigation size={14} /> Directions</button>
          </div>
        </Card>
      ))}
    </div>
  );
};

/* ── PHASE 6 · Family Radar ──────────────────────────────────────────────── */
const agoLabel = (ts) => { const s = Math.max(0, Math.floor((Date.now() - ts) / 1000)); return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`; };

export const FamilyRadar = () => {
  const navigate = useNavigate();
  const { child } = useChild();
  const { getTelemetry, liveChildId, liveZones } = useRealtime();
  const r = RADAR[child.id];
  // Real GPS for the paired child arrives over Socket.IO (telemetry.coords).
  // Other (demo) children, or before the first real fix, fall back to demo coords.
  const tel = getTelemetry(child.id);
  const realCoord = (child.id === liveChildId && tel && tel.coords) ? [tel.coords.lat, tel.coords.lng] : null;
  const isReal = !!realCoord;
  const cc = realCoord || r.coord;                      // child [lat,lng]
  const [fix, setFix] = useState(null);
  const [pAddr, setPAddr] = useState(null);
  const [zonesOpen, setZonesOpen] = useState(false);
  const [moving, setMoving] = useState(null);
  const prevRef = useRef(null);
  const flyRef = useRef(null);
  const savedZones = JSON.parse(localStorage.getItem('ag_safezones') || '[]');
  const parentLL = fix ? fix.parent : null;             // [lng,lat] — real parent GPS only
  const dist = parentLL ? haversine(parentLL, [cc[1], cc[0]]) : null;
  const eta = dist != null ? Math.max(1, Math.round(dist / 0.4)) : null; // ~24 km/h avg

  // Refresh the "updated Ns ago" label between location pushes.
  const [, force] = useState(0);
  useEffect(() => { const i = setInterval(() => force((x) => x + 1), 5000); return () => clearInterval(i); }, []);

  // Real movement from consecutive GPS fixes (> ~30 m ⇒ moving).
  useEffect(() => {
    if (!isReal) { setMoving(null); return; }
    const p = prevRef.current;
    if (p && (p[0] !== cc[0] || p[1] !== cc[1])) { const d = haversine([p[1], p[0]], [cc[1], cc[0]]); setMoving(d > 0.03 ? 'Moving' : 'Not moving'); }
    prevRef.current = cc;
  }, [isReal, cc[0], cc[1]]);
  const movement = isReal ? (moving || 'Locating') : r.movement;
  const Mv = movement === 'Moving' ? Footprints : (MOVE[movement] || Pause);
  const updatedAgo = (isReal && tel && tel.locUpdatedAt) ? agoLabel(tel.locUpdatedAt) : null;

  // Reverse-geocode the detected parent location for a real address.
  const handleFix = (f) => {
    setFix(f);
    const [lng, lat] = f.parent;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`)
      .then((r2) => r2.json())
      .then((d) => { const a = d.address || {}; setPAddr([a.road, a.suburb || a.neighbourhood || a.hamlet, a.city || a.town || a.village].filter(Boolean).join(', ') || d.display_name || ''); })
      .catch(() => {});
  };

  const dirUrl = (mode) => `https://www.google.com/maps/dir/?api=1&destination=${cc[0]},${cc[1]}${mode ? `&travelmode=${mode}` : ''}`;
  const share = async () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${cc[0]},${cc[1]}`;
    const data = { title: `${child.name}'s location`, text: `${child.name} is near ${child.location.area}, ${child.location.city}.`, url };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard?.writeText(url); alert('Location link copied to clipboard'); } } catch (e) {}
  };

  return (
    <Page title="Family Radar" sub={`${child.name} · ${isReal ? `Live GPS · updated ${updatedAgo}` : 'demo location'}`} back={false}
      right={<div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10"><Mv size={13} className="text-cyan-400" /><span className="text-[11px] font-bold text-slate-300">{movement}</span></div>}>
      <RadarMap child={child} childCoord={cc} zones={savedZones} height={340} onFix={handleFix} onMap={(fn) => (flyRef.current = fn)} />

      <Card className="p-4">
        {parentLL ? (
          <>
            <p className="text-white font-black text-[15px]">You are {dist} km away from {child.name}</p>
            <p className="text-cyan-400 text-[12.5px] font-bold mt-0.5">ETA {eta} min · {isReal ? 'Live child GPS' : 'Approx. location'}</p>
          </>
        ) : (
          <>
            <p className="text-white font-black text-[15px]">Locating you…</p>
            <p className="text-slate-400 text-[12.5px] font-semibold mt-0.5">Allow location to measure distance to {child.name}</p>
          </>
        )}
      </Card>

      {/* Safe-zone status — current zone / inside-outside / nearest (geofenced) */}
      {liveZones && liveZones.length > 0 && (() => {
        const withD = liveZones.map((z) => ({ ...z, d: distMeters(cc[0], cc[1], z.lat, z.lng) })).sort((a, b) => a.d - b.d);
        const inside = withD.find((z) => z.d <= (z.radius || 100));
        const nearest = withD[0];
        const c = inside ? '#10b981' : '#f59e0b';
        return (
          <Card className="flex items-center gap-3.5 p-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${c}1f` }}><Shield size={19} style={{ color: c }} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-[14px] truncate">{inside ? `Inside ${inside.name}` : 'Outside safe zones'}</p>
              <p className="text-slate-500 text-[12px] font-semibold truncate">{inside ? `${inside.type || 'zone'} · ${zoneRadiusLabel(inside.radius || 100)} radius` : `Nearest: ${nearest.name} · ${(nearest.d / 1000).toFixed(2)} km away`}</p>
            </div>
            <span className="text-[10px] font-black px-2 py-1 rounded-full flex-shrink-0" style={{ background: `${c}1f`, color: c }}>{inside ? 'IN ZONE' : 'OUTSIDE'}</span>
          </Card>
        );
      })()}

      {/* Add Safe Zone — placed above the action buttons */}
      <button onClick={() => navigate('/app/safe-zones/add')} className="ag-tap w-full h-[54px] rounded-2xl bg-cyan-500/12 border border-cyan-400/25 text-cyan-300 font-bold flex items-center justify-center gap-2"><MapPin size={18} /> Add Safe Zone</button>

      {/* View safe zones dropdown */}
      <div>
        <button onClick={() => setZonesOpen((o) => !o)} className="ag-tap w-full h-[52px] rounded-2xl bg-[#0b0c14] border border-white/[0.08] flex items-center justify-between px-4">
          <span className="flex items-center gap-2 text-white font-bold text-[14px]"><Shield size={17} className="text-cyan-400" /> View safe zones{savedZones.length ? ` (${savedZones.length})` : ''}</span>
          <ChevronDown size={18} className={`text-slate-500 transition-transform ${zonesOpen ? 'rotate-180' : ''}`} />
        </button>
        {zonesOpen && (
          <div className="mt-2 rounded-[18px] border border-white/[0.07] bg-[#0b0c14] divide-y divide-white/[0.05] overflow-hidden">
            {savedZones.length ? savedZones.map((z) => (
              <button key={z.id} onClick={() => { flyRef.current && flyRef.current([z.lat, z.lng], 16); setZonesOpen(false); }} className="ag-tap w-full flex items-center gap-3 p-3.5 text-left">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0"><MapPin size={16} className="text-cyan-400" /></div>
                <div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px] truncate">{z.name}</p><p className="text-slate-500 text-[12px] font-semibold truncate">{z.address || `${z.lat.toFixed(4)}, ${z.lng.toFixed(4)}`}</p></div>
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            )) : <div className="p-4 text-center text-slate-500 text-[12.5px] font-semibold">No safe zones yet. Tap “Add Safe Zone”.</div>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => openUrl(dirUrl('driving'))} className="ag-tap flex items-center justify-center gap-2 h-[54px] rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-[14px] shadow-[0_8px_28px_rgba(37,99,235,0.35)]"><Navigation size={18} /> Navigate</button>
        <button onClick={share} className="ag-tap flex items-center justify-center gap-2 h-[54px] rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-extrabold text-[14px] shadow-[0_8px_28px_rgba(168,85,247,0.35)]"><Share2 size={18} /> Share</button>
      </div>
      <button onClick={() => (child.phone ? (window.location.href = `tel:${child.phone}`) : navigate('/app/settings/profile'))} aria-label={`Call ${child.name}`} className="ag-tap w-full flex items-center justify-center gap-2 h-[54px] rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-extrabold text-[14px]"><Phone size={18} /> Call {child.name}</button>

      <NearbyPolice coord={cc} area={child.location.area} />

      <Card className="flex items-center gap-3 p-4"><div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-white font-black text-[13px]">J</div><div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px]">You</p><p className="text-slate-500 text-[12px] font-semibold truncate">{pAddr || (fix ? 'Your current location' : 'Allow location to detect your position…')}</p></div></Card>
    </Page>
  );
};

/* ── Emergency SOS card (used on dashboard + emergency center) ────────────── */
export const EmergencyCard = ({ child }) => {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative overflow-hidden rounded-[24px] border-2 border-rose-500/50 bg-gradient-to-br from-rose-600/25 to-red-700/10 p-5">
      <motion.div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-rose-500/20 blur-3xl" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.6 }} />
      <div className="relative flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-rose-500/25 border border-rose-400/50 flex items-center justify-center"><Siren size={22} className="text-rose-300" /></div>
        <div className="flex-1"><p className="text-rose-200 text-[11px] font-black uppercase tracking-[0.15em]">SOS Triggered</p><p className="text-white font-black text-[18px] leading-tight">{child.name} needs help</p></div>
        <span className="text-rose-200/80 text-[12px] font-bold flex items-center gap-1"><Clock size={13} /> now</span>
      </div>
      <div className="relative grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl bg-black/25 border border-white/10 p-2.5"><p className="text-slate-300 text-[11px] font-bold flex items-center gap-1"><MapPin size={12} className="text-rose-300" /> {child.location.area}</p></div>
        <div className="rounded-xl bg-black/25 border border-white/10 p-2.5"><p className="text-slate-300 text-[11px] font-bold flex items-center gap-1"><BatteryMedium size={12} className="text-rose-300" /> {child.battery}% · {child.online ? 'Online' : 'Offline'}</p></div>
        <div className="rounded-xl bg-black/25 border border-white/10 p-2.5"><p className="text-slate-300 text-[11px] font-bold flex items-center gap-1"><Shield size={12} className="text-rose-300" /> {NEARBY.police[0].name.split('—')[0]}· {NEARBY.police[0].dist}</p></div>
        <div className="rounded-xl bg-black/25 border border-white/10 p-2.5"><p className="text-slate-300 text-[11px] font-bold flex items-center gap-1"><Hospital size={12} className="text-rose-300" /> {NEARBY.hospitals[0].dist} away</p></div>
      </div>
      <div className="relative grid grid-cols-3 gap-2">
        <button className="ag-tap flex items-center justify-center gap-1.5 h-11 rounded-xl bg-rose-500 text-white font-black text-[12.5px]"><Phone size={15} /> Call</button>
        <button className="ag-tap flex items-center justify-center gap-1.5 h-11 rounded-xl bg-white/10 border border-white/15 text-white font-bold text-[12.5px]"><Navigation size={15} /> Directions</button>
        <button onClick={() => navigate('/app/emergency')} className="ag-tap flex items-center justify-center gap-1.5 h-11 rounded-xl bg-white/10 border border-white/15 text-white font-bold text-[12.5px]"><Route size={15} /> Route</button>
      </div>
    </motion.div>
  );
};

/* ── PHASE 8 · Emergency Command Center ──────────────────────────────────── */
export const EmergencyCommand = () => {
  const navigate = useNavigate();
  const { child } = useChild();
  const { getTelemetry, liveChildId, liveZones, liveZoneEvents } = useRealtime();
  const em = EMERGENCY[child.id];
  const tel = getTelemetry(child.id);
  const liveCoords = (child.id === liveChildId && tel && tel.coords) ? tel.coords : null;
  const nearestZone = (liveCoords && liveZones && liveZones.length) ? liveZones.map((z) => ({ ...z, d: distMeters(liveCoords.lat, liveCoords.lng, z.lat, z.lng) })).sort((a, b) => a.d - b.d)[0] : null;
  const lastZoneEv = (liveZoneEvents && liveZoneEvents[0]) || null;
  const zoneVerb = (t) => ({ enter: 'Entered', exit: 'Exited', late: 'Late at', missed: 'Missed', stayed: 'Stayed at' }[t] || 'Event');
  const sos = new URLSearchParams(useLocation().search).get('sos') === '1';
  const [prefs, setPrefs] = useState({ push: true, email: true, voice: true, sms: false });
  const [vol, setVol] = useState(80);
  const [auto, setAuto] = useState({ loc: true, sms: true, email: true, family: true, contacts: false });
  const threatColor = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' }[em.threat];

  const announce = () => speak(sosAnnouncement(child, getTelemetry(child.id)), { code: 'en' });
  // Auto voice announcement when arriving via an SOS trigger.
  useEffect(() => { if (sos && prefs.voice) announce(); }, [sos]); // eslint-disable-line

  const emAction = (t) => {
    if (t === 'Call Child') return child.phone ? (window.location.href = `tel:${child.phone}`) : navigate('/app/settings/profile');
    if (t === 'Call Police') return (window.location.href = 'tel:911');
    if (t === 'Call Hospital') return (window.location.href = `tel:${NEARBY.hospitals[0].phone}`);
    if (t === 'Call Parent') return (window.location.href = 'tel:911');
  };

  return (
    <Page title="Emergency Center" sub={`${child.name} · ${child.device}`} back={false}>
      {sos ? <EmergencyCard child={child} /> : (
        <Card className="flex items-center gap-3.5 p-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${threatColor}1f` }}><Siren size={20} style={{ color: threatColor }} /></div>
          <div className="flex-1"><p className="text-white font-bold text-[14px]">{em.level}</p><p className="text-[12.5px] font-semibold" style={{ color: threatColor }}>Threat level: {em.threat}</p></div>
        </Card>
      )}

      <button className="ag-tap w-full overflow-hidden rounded-[22px] border border-rose-500/30 bg-gradient-to-r from-rose-600/20 to-red-600/10 p-4 flex items-center gap-3.5"><div className="relative"><motion.div className="absolute -inset-1.5 rounded-full bg-rose-500/30 blur" animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ repeat: Infinity, duration: 1.6 }} /><div className="relative w-11 h-11 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center"><Siren size={20} className="text-rose-400" /></div></div><div className="flex-1 text-left"><p className="text-white font-black text-[15px]">Trigger SOS Alert</p><p className="text-rose-200/70 text-[12px] font-semibold">Notify all guardians instantly</p></div></button>

      {/* Real-time child location (live GPS via Socket.IO; updated by SOS too) */}
      <button onClick={() => navigate('/app/location')} className="ag-tap w-full flex items-center gap-3.5 p-4 rounded-[22px] border border-white/[0.08] bg-[#0b0c14] text-left">
        <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center flex-shrink-0"><MapPin size={20} className="text-cyan-400" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-[14px]">{liveCoords ? 'Live location' : "Child's location"}</p>
          <p className="text-slate-500 text-[12px] font-semibold truncate">{liveCoords ? `${liveCoords.lat.toFixed(5)}, ${liveCoords.lng.toFixed(5)}` : child.location.area}</p>
        </div>
        {liveCoords && <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 flex-shrink-0">LIVE</span>}
        <ChevronRight size={17} className="text-slate-600 flex-shrink-0" />
      </button>

      {/* Safe-zone context for emergencies */}
      {(nearestZone || lastZoneEv) && (
        <Card className="divide-y divide-white/[0.05]">
          {nearestZone && (
            <div className="flex items-center gap-3.5 p-3.5"><div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0"><Shield size={17} className="text-emerald-400" /></div><div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px]">Nearest safe zone</p><p className="text-slate-500 text-[12px] font-semibold truncate">{nearestZone.name} · {(nearestZone.d / 1000).toFixed(2)} km away</p></div></div>
          )}
          {lastZoneEv && (
            <div className="flex items-center gap-3.5 p-3.5"><div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0"><MapPin size={17} className="text-cyan-400" /></div><div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px]">Last safe-zone event</p><p className="text-slate-500 text-[12px] font-semibold truncate">{zoneVerb(lastZoneEv.type)} {lastZoneEv.zoneName}</p></div></div>
          )}
        </Card>
      )}

      <Label>Nearby Emergency Services</Label>
      {[{ list: NEARBY.police, icon: Shield, a: '#3b82f6', kind: 'Police' }, { list: NEARBY.hospitals, icon: Hospital, a: '#ef4444', kind: 'Hospital' }].map((g) => (
        <div key={g.kind} className="flex flex-col gap-2.5">
          {g.list.map((s) => (
            <Card key={s.name} className="p-4">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${g.a}1f` }}><g.icon size={18} style={{ color: g.a }} /></div><div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px] truncate">{s.name}</p><p className="text-slate-500 text-[12px] font-semibold">{g.kind} · {s.dist}</p></div></div>
              <div className="grid grid-cols-3 gap-2 mt-3"><button className="ag-tap flex items-center justify-center gap-1 h-9 rounded-xl bg-emerald-500/15 text-emerald-300 font-bold text-[12px]"><Phone size={13} /> Call</button><button className="ag-tap flex items-center justify-center gap-1 h-9 rounded-xl bg-white/[0.05] border border-white/10 text-white font-bold text-[12px]"><Navigation size={13} /> Directions</button><button className="ag-tap flex items-center justify-center gap-1 h-9 rounded-xl bg-white/[0.05] border border-white/10 text-white font-bold text-[12px]"><MapPin size={13} /> Maps</button></div>
            </Card>
          ))}
        </div>
      ))}

      <Label>Emergency Timeline</Label>
      <Card className="divide-y divide-white/[0.05]">{em.timeline.map((t, i) => (<div key={i} className="flex items-center gap-3 p-3.5"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.a }} /><span className="flex-1 text-white font-semibold text-[13px]">{t.e}</span><span className="text-slate-600 text-[11px] font-bold">{t.t}</span></div>))}</Card>

      <Label>Emergency Actions</Label>
      <button onClick={announce} aria-label="Play SOS voice alert" className="ag-tap w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-violet-500/15 border border-violet-400/30 text-violet-200 font-bold text-[13px] mb-1"><Volume2 size={16} /> Play SOS Voice Alert</button>
      <div className="grid grid-cols-2 gap-2.5">
        {[{ t: 'Call Child', i: Phone }, { t: 'Call Parent', i: Phone }, { t: 'Call Police', i: Shield }, { t: 'Call Hospital', i: Hospital }, { t: 'Open Route', i: Route }, { t: 'Share Report', i: Share2 }].map((a) => (
          <button key={a.t} onClick={() => emAction(a.t)} aria-label={a.t} className="ag-tap flex items-center gap-2.5 p-3.5 rounded-2xl border border-white/[0.08] bg-[#0b0c14]"><a.i size={17} className="text-cyan-400" /><span className="text-white font-bold text-[13px]">{a.t}</span></button>
        ))}
      </div>

      <Label>Emergency Contact Priority</Label>
      <Card className="divide-y divide-white/[0.05]">
        {['Mother · Jane', 'Father · Mark', 'Guardian', 'Emergency Services · 911'].map((c, i) => (
          <div key={c} className="flex items-center gap-3 p-3.5"><span className="w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-400 text-[12px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span><span className="flex-1 text-white font-bold text-[13.5px]">{c}</span><a href="tel:911" className="ag-tap"><Phone size={15} className="text-emerald-400" /></a></div>
        ))}
      </Card>

      <Label>Emergency Auto Actions</Label>
      <Card className="divide-y divide-white/[0.05]">
        {[['loc', 'Share location'], ['sms', 'Send SMS'], ['email', 'Send Email'], ['family', 'Notify Family'], ['contacts', 'Notify Emergency Contacts']].map(([k, t]) => (
          <button key={k} onClick={() => setAuto({ ...auto, [k]: !auto[k] })} className="ag-tap w-full flex items-center gap-3 p-4">
            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${auto[k] ? 'bg-cyan-500 border-transparent' : 'border-white/20'}`}>{auto[k] && <Check size={12} className="text-[#030307]" strokeWidth={3.5} />}</span>
            <span className="flex-1 text-left text-white font-bold text-[14px]">{t}</span>
          </button>
        ))}
      </Card>

      <Label>Alert Preferences</Label>
      <Card className="divide-y divide-white/[0.05]">
        {[['push', 'Push Notifications', Bell], ['email', 'Email Alerts', Mail], ['voice', 'Voice Alerts', Volume2], ['sms', 'SMS Ready', MessageCircle]].map(([k, t, I]) => (<div key={k} className="flex items-center gap-3 p-4"><I size={17} className="text-cyan-400" /><span className="flex-1 text-white font-bold text-[14px]">{t}</span><Toggle on={prefs[k]} onClick={() => setPrefs({ ...prefs, [k]: !prefs[k] })} /></div>))}
        <div className="p-4"><div className="flex items-center justify-between mb-2"><span className="text-white font-bold text-[14px] flex items-center gap-2"><Volume2 size={16} className="text-cyan-400" /> AI Voice Volume</span><span className="text-cyan-400 font-black text-[13px]">{vol}%</span></div><input type="range" min="0" max="100" value={vol} onChange={(e) => setVol(+e.target.value)} className="w-full accent-cyan-400" /></div>
      </Card>
    </Page>
  );
};

/* ── PHASE 9 · AI Parenting Copilot ──────────────────────────────────────── */
const RiskGraph = ({ data, color }) => {
  const max = 100, w = 260, h = 60;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (<svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[60px]"><motion.polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4 }} /></svg>);
};
export const AICopilot = () => {
  const navigate = useNavigate();
  const { child } = useChild();
  const c = COPILOT[child.id];
  const riskColor = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' }[c.riskLevel];
  const up = c.risk[c.risk.length - 1] >= c.risk[0];

  return (
    <Page title="AI Copilot" sub={`DISHA · ${child.name}'s week`} back={false}>
      <div className="flex items-center gap-3 rounded-[22px] p-4 border border-violet-400/20 bg-gradient-to-r from-violet-500/15 to-indigo-500/5">
        <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(140deg,#a855f7,#6366f1)' }}><Sparkles size={22} className="text-white" /></div>
        <p className="flex-1 text-slate-200 text-[13px] font-semibold leading-snug">Here’s {child.name}’s weekly intelligence summary.</p>
      </div>

      {/* Talk to DISHA — chat or premium voice mode */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/app/disha')} aria-label="Chat with DISHA" className="ag-tap ag-press flex flex-col items-start gap-2 p-4 rounded-[22px] border border-white/[0.08] bg-[#0b0c14] text-left">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center"><MessageCircle size={20} className="text-cyan-300" /></div>
          <p className="text-white font-black text-[14.5px]">Chat with DISHA</p>
          <p className="text-slate-500 text-[11.5px] font-semibold">Type your questions</p>
        </button>
        <button onClick={() => navigate('/app/ai/voice')} aria-label="Speak with DISHA" className="ag-tap ag-press relative overflow-hidden flex flex-col items-start gap-2 p-4 rounded-[22px] border border-violet-400/30 bg-gradient-to-br from-violet-600/25 to-indigo-600/10 text-left">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-violet-500/30 blur-2xl" />
          <div className="w-11 h-11 rounded-2xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center"><Mic size={20} className="text-violet-200" /></div>
          <p className="text-white font-black text-[14.5px]">Speak with DISHA</p>
          <p className="text-violet-200/70 text-[11.5px] font-semibold">Premium voice mode</p>
        </button>
      </div>

      <Label>Weekly Family Summary</Label>
      <div className="grid grid-cols-2 gap-3">
        {c.summary.map((s) => (<Card key={s.t} className="p-4"><p className="text-slate-400 text-[12px] font-semibold leading-tight">{s.t}</p><p className="font-black text-[18px] mt-1" style={{ color: s.good ? '#10b981' : '#ef4444' }}>{s.d}</p></Card>))}
      </div>

      <Label>Risk Analysis</Label>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-2"><span className="font-black text-[16px]" style={{ color: riskColor }}>{c.riskLevel} Risk</span><span className="text-[12px] font-bold flex items-center gap-1" style={{ color: up ? '#ef4444' : '#10b981' }}>{up ? <TrendingUp size={14} /> : <TrendingDown size={14} />} trend</span></div>
        <RiskGraph data={c.risk} color={riskColor} />
      </Card>

      <Label>Behavior Analysis</Label>
      {c.behavior.map((b) => (<Card key={b.t} className="flex items-center gap-3 p-4"><div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${b.a}1f` }}><AlertTriangle size={16} style={{ color: b.a }} /></div><span className="text-white font-semibold text-[13.5px]">{b.t}</span></Card>))}

      <Label>Sleep Intelligence</Label>
      <Card className="p-4 grid grid-cols-2 gap-3">
        {[['Bedtime', c.sleep.bedtime, Moon], ['Avg sleep', c.sleep.avg, Moon], ['Consistency', `${c.sleep.consistency}%`, TrendingUp], ['Night activity', c.sleep.nightActivity, AlertTriangle]].map(([t, v, I]) => (<div key={t} className="flex items-center gap-2.5"><I size={16} className="text-indigo-300" /><div><p className="text-slate-500 text-[11px] font-bold uppercase">{t}</p><p className="text-white font-black text-[14px]">{v}</p></div></div>))}
      </Card>

      <Label>School Safety Intelligence</Label>
      <Card className="p-4 grid grid-cols-3 gap-2">
        {[['Arrival', c.school.arrival], ['Departure', c.school.departure], ['Attendance', c.school.attendance]].map(([t, v]) => (<div key={t} className="text-center"><div className="relative w-14 h-14 mx-auto"><svg width="56" height="56" className="-rotate-90"><circle cx="28" cy="28" r="22" stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none" /><circle cx="28" cy="28" r="22" stroke="#10b981" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - v / 100)} /></svg><div className="absolute inset-0 flex items-center justify-center text-white font-black text-[12px]">{v}%</div></div><p className="text-slate-500 text-[10px] font-bold mt-1">{t}</p></div>))}
      </Card>

      <Label>Parent Recommendations</Label>
      <Card className="p-4 flex flex-col gap-3">{c.recs.map((r, i) => (<div key={i} className="flex items-start gap-3"><div className="w-7 h-7 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0"><Sparkles size={14} className="text-violet-400" /></div><p className="text-slate-300 text-[13px] font-medium leading-relaxed">{r}</p></div>))}</Card>

      <button onClick={() => navigate('/app/disha')} className="ag-tap w-full h-[56px] rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-extrabold flex items-center justify-center gap-2"><MessageCircle size={18} /> Chat with DISHA</button>
    </Page>
  );
};

/* ── DISHA Chat ──────────────────────────────────────────────────────────── */
export const DishaChat = () => {
  const { child } = useChild();
  const prompts = [`How is ${child.name} doing this week?`, `Is ${child.name} sleeping enough?`, 'Show risk trends', 'Why did screen time change?'];
  return (
    <div className="flex flex-col h-full" style={{ minHeight: 'calc(100dvh - 200px)' }}>
      <Page title="DISHA" sub="AI Parenting Copilot">
        <div className="flex flex-col gap-3">
          <div className="self-start max-w-[86%] bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 text-[13.5px] text-slate-200 leading-relaxed">Hi Jane 👋 I’ve reviewed {child.name}’s week. {child.risk === 'Medium' ? 'A few things to watch — ask me anything.' : 'Everything looks healthy.'}</div>
          <div className="self-end max-w-[80%] bg-gradient-to-r from-violet-500 to-indigo-600 rounded-2xl rounded-tr-md px-4 py-3 text-[13.5px] text-white font-semibold">How is {child.name} doing this week?</div>
          <div className="self-start max-w-[86%] bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 text-[13.5px] text-slate-200 leading-relaxed">
            <p className="font-bold text-white mb-1.5">Weekly snapshot</p>
            {COPILOT[child.id].summary.map((s) => (<p key={s.t} className="flex items-center gap-2 text-[12.5px] py-0.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: s.good ? '#10b981' : '#ef4444' }} /> {s.t}: <span className="font-bold" style={{ color: s.good ? '#10b981' : '#ef4444' }}>{s.d}</span></p>))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-1">{prompts.map((p) => (<span key={p} className="px-3 py-2 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-300 text-[12px] font-bold">{p}</span>))}</div>
        <div className="flex items-center gap-2 px-4 h-[54px] rounded-full bg-[#11131d] border border-white/10 mt-2"><input placeholder="Ask DISHA anything…" className="flex-1 bg-transparent outline-none text-white text-[15px] placeholder-slate-600" /><button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(140deg,#a855f7,#6366f1)' }}><Send size={16} className="text-white" /></button></div>
      </Page>
    </div>
  );
};
