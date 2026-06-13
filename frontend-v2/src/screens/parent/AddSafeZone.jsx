import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, PersonStanding, MapPin, Check, Home, GraduationCap, BookOpen, Heart, Users, Search, Star } from 'lucide-react';
import { createZoneRemote } from '../../lib/zones';

const DEFAULT = [30.2672, -97.7431];
const DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
const RADII = [100, 250, 500, 1000];
const radiusLabel = (m) => (m >= 1000 ? `${m / 1000}km` : `${m}m`);
const PRESETS = [{ n: 'Home', i: Home, t: 'home' }, { n: 'School', i: GraduationCap, t: 'school' }, { n: 'Tuition', i: BookOpen, t: 'tuition' }, { n: 'Relative House', i: Heart, t: 'relative' }, { n: 'Friend House', i: Users, t: 'friend' }, { n: 'Custom', i: Star, t: 'custom' }];

const pinIcon = () => L.divIcon({ className: '', iconSize: [38, 48], iconAnchor: [19, 44], html:
  `<div style="display:flex;flex-direction:column;align-items:center"><div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#06b6d4;border:2px solid #fff;box-shadow:0 0 16px rgba(6,182,212,.8);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);color:#031;font-weight:900;font-size:14px">★</span></div></div>` });

const Clicker = ({ onPick }) => { useMapEvents({ click(e) { onPick([e.latlng.lat, e.latlng.lng]); } }); return null; };
const Ctrl = ({ goRef }) => { const map = useMap(); React.useEffect(() => { goRef.current = (ll, z = 16) => map.flyTo(ll, z, { duration: 1 }); }, []); return null; };

const AddSafeZone = () => {
  const navigate = useNavigate();
  const [point, setPoint] = useState(null);
  const [radius, setRadius] = useState(100);
  const [customR, setCustomR] = useState('');
  const [type, setType] = useState('custom');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [query, setQuery] = useState('');
  const [expected, setExpected] = useState('');
  const [locating, setLocating] = useState(false);
  const goRef = useRef(null);

  // Search a place / manual address → geocode to a pin (method: Search / Manual Address).
  const search = async () => {
    const q = query.trim(); if (!q) return;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      const d = await r.json();
      if (d[0]) { const ll = [parseFloat(d[0].lat), parseFloat(d[0].lon)]; setPoint(ll); setAddress(d[0].display_name || ''); goRef.current && goRef.current(ll, 16); }
    } catch { /* noop */ }
  };

  const reverse = async (ll) => {
    setAddress('Locating…');
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${ll[0]}&lon=${ll[1]}&zoom=18&addressdetails=1`);
      const d = await r.json();
      const a = d.address || {};
      setAddress([a.road, a.suburb || a.neighbourhood, a.city || a.town || a.village].filter(Boolean).join(', ') || d.display_name || '');
    } catch { setAddress(''); }
  };
  const pick = (ll) => { setPoint(ll); reverse(ll); };
  const useCurrent = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { const ll = [p.coords.latitude, p.coords.longitude]; pick(ll); goRef.current?.(ll, 16); setLocating(false); },
      () => setLocating(false), { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  // Auto-detect current location on open so it starts where you actually are.
  useEffect(() => { const t = setTimeout(() => useCurrent(), 500); return () => clearTimeout(t); }, []); // eslint-disable-line

  const confirm = () => {
    const z = { id: Date.now(), name: name.trim() || 'New Zone', type, lat: point[0], lng: point[1], radius, address, expectedArrival: expected || null };
    const zones = JSON.parse(localStorage.getItem('ag_safezones') || '[]');
    zones.push(z);
    localStorage.setItem('ag_safezones', JSON.stringify(zones));
    // Register with the backend so it is geofenced against the child's real GPS.
    createZoneRemote({ name: z.name, type, lat: z.lat, lng: z.lng, radius, address, expectedArrival: expected || undefined });
    navigate('/app/safe-zones');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>
        <div className="flex-1"><h1 className="text-[22px] font-black text-white tracking-tight leading-tight">Add Safe Zone</h1><p className="text-slate-500 text-[13px] font-semibold">Tap the map to drop a pin, or use your location</p></div>
      </div>

      {/* Search a place or type a manual address */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="Search a place or enter an address…" className="w-full h-11 rounded-2xl bg-[#0b0c14] border border-white/10 pl-10 pr-20 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/40" />
        <button onClick={search} className="ag-tap absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold text-[12px]">Search</button>
      </div>

      <div className="relative rounded-[22px] overflow-hidden border border-white/[0.08]" style={{ height: 300 }}>
        <MapContainer center={DEFAULT} zoom={14} maxZoom={21} style={{ height: '100%', width: '100%', background: '#05070d' }} zoomControl={false} attributionControl={false}>
          <TileLayer url={DARK} subdomains={['a', 'b', 'c', 'd']} maxZoom={21} maxNativeZoom={19} />
          <Clicker onPick={pick} />
          <Ctrl goRef={goRef} />
          {point && <><Marker position={point} icon={pinIcon()} /><Circle center={point} radius={radius} pathOptions={{ color: '#06b6d4', weight: 1.5, fillColor: '#06b6d4', fillOpacity: 0.12 }} /></>}
        </MapContainer>
        <button onClick={useCurrent} className="ag-tap absolute top-3 right-3 z-[1000] flex items-center gap-1.5 pl-2.5 pr-3 h-9 rounded-full bg-cyan-500/90 text-[#031018] font-bold text-[12px] shadow-lg">
          <PersonStanding size={16} /> {locating ? 'Locating…' : 'Use current location'}
        </button>
        {!point && <div className="absolute bottom-3 left-3 right-3 z-[1000] text-center text-[12px] font-semibold text-white/80 bg-black/55 backdrop-blur-md rounded-xl py-2 border border-white/10">Tap anywhere on the map to place the zone</div>}
      </div>

      {/* Confirmation panel */}
      {point ? (
        <div className="rounded-[22px] border border-white/[0.07] bg-[#0b0c14] p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center"><MapPin size={20} className="text-cyan-400" /></div>
            <div className="flex-1 min-w-0"><p className="text-white font-black text-[15px]">{name.trim() || 'New Safe Zone'}</p><p className="text-slate-500 text-[12px] font-semibold truncate">{address || `${point[0].toFixed(5)}, ${point[1].toFixed(5)}`}</p></div>
          </div>

          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.12em] mb-2 px-1">Name this location</p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Home" className="w-full min-w-0 px-4 h-[52px] rounded-2xl bg-[#11131d] border border-white/[0.08] focus:border-cyan-500/50 outline-none text-white text-[16px] font-medium placeholder-slate-600" />
            <div className="flex flex-wrap gap-2 mt-2.5">
              {PRESETS.map((p) => (<button key={p.n} onClick={() => { setType(p.t); if (p.t !== 'custom') setName(p.n); }} className={`ag-tap flex items-center gap-1.5 px-3 h-8 rounded-full border text-[12px] font-bold ${type === p.t ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`}><p.i size={13} /> {p.n}</button>))}
            </div>
          </div>

          {/* Radius */}
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.12em] mb-2 px-1">Zone radius</p>
            <div className="flex flex-wrap gap-2">
              {RADII.map((m) => (<button key={m} onClick={() => { setRadius(m); setCustomR(''); }} className={`ag-tap px-3.5 h-9 rounded-full border text-[12.5px] font-bold ${radius === m && !customR ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`}>{radiusLabel(m)}</button>))}
              <input value={customR} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setCustomR(v); if (v) setRadius(Math.max(20, Math.min(20000, +v))); }} placeholder="Custom m" className="w-[96px] h-9 rounded-full bg-[#0b0c14] border border-white/10 px-3 text-[12.5px] text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/40" />
            </div>
          </div>

          {/* Optional expected arrival → enables late / missed alerts */}
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.12em] mb-2 px-1">Expected arrival (optional)</p>
            <input type="time" value={expected} onChange={(e) => setExpected(e.target.value)} className="w-full h-[48px] rounded-2xl bg-[#11131d] border border-white/[0.08] px-4 text-[15px] text-white outline-none focus:border-cyan-400/40" />
          </div>

          <button onClick={confirm} className="ag-tap w-full h-[56px] rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold flex items-center justify-center gap-2"><Check size={18} /> Confirm Safe Zone</button>
        </div>
      ) : (
        <div className="rounded-[22px] border border-white/[0.07] bg-[#0b0c14] p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-3xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3"><MapPin size={24} className="text-slate-500" /></div>
          <p className="text-white font-bold text-[14px]">No location selected yet</p>
          <p className="text-slate-500 text-[12.5px] font-semibold mt-1">Tap the map or use your current location to begin.</p>
        </div>
      )}
    </div>
  );
};

export default AddSafeZone;
