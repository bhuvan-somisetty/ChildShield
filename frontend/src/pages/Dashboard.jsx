import React, { useState, useEffect } from 'react';
import {
  Smartphone, ShieldCheck, MapPin, Navigation, Lock, Unlock, Phone,
  Brain, Clock, ChevronRight, BatteryMedium, Sparkles, Plus,
} from 'lucide-react';
import { useLivePolling } from '../hooks/useLivePolling';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ConfirmationModal from '../components/layout/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui';

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createEmoji = (emoji, size = 30) => L.divIcon({
  html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${emoji}</div>`,
  className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
});
const CHILD_ICON = createEmoji('🧒', 28);

const safetyScoreTrendData = [
  { name: 'Sun', score: 92 }, { name: 'Mon', score: 94 }, { name: 'Tue', score: 95 },
  { name: 'Wed', score: 91 }, { name: 'Thu', score: 96 }, { name: 'Fri', score: 98 }, { name: 'Sat', score: 97 },
];
const weeklyScreenTimeData = [
  { name: 'Mon', hours: 1.5 }, { name: 'Tue', hours: 2.2 }, { name: 'Wed', hours: 2.8 },
  { name: 'Thu', hours: 1.8 }, { name: 'Fri', hours: 2.0 }, { name: 'Sat', hours: 3.5 }, { name: 'Sun', hours: 2.4 },
];

const SectionLabel = ({ children, action, onAction }) => (
  <div className="flex items-center justify-between mb-3 px-1">
    <h3 className="text-[13px] font-black text-white tracking-tight">{children}</h3>
    {action && (
      <button onClick={onAction} className="ag-tap flex items-center gap-0.5 text-[12px] font-bold text-cyan-400">
        {action} <ChevronRight size={14} />
      </button>
    )}
  </div>
);

const QuickAction = ({ icon: Icon, label, color, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="ag-tap flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] disabled:opacity-50"
  >
    <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${color}1f`, border: `1px solid ${color}40` }}>
      <Icon size={20} style={{ color }} />
    </div>
    <span className="text-[12px] font-bold text-slate-200">{label}</span>
  </button>
);

const Dashboard = () => {
  const { activeChild, setActiveChild, token } = useAuth();
  const data = useLivePolling('/api/dashboard');
  const history = useLivePolling('/api/history') || [];
  const navigate = useNavigate();

  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [lockingDevice, setLockingDevice] = useState(false);
  const [lockMsg, setLockMsg] = useState('');
  const [locations, setLocations] = useState([]);
  const [childGeo, setChildGeo] = useState(null);

  useEffect(() => {
    if (activeChild && token) {
      fetch(`/api/device/locations/${activeChild.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.locations && d.locations.length > 0) {
            setLocations(d.locations);
            const latest = d.locations[d.locations.length - 1];
            fetch(`/api/device/reverse-geocode?lat=${latest.latitude}&lon=${latest.longitude}`, { headers: { Authorization: `Bearer ${token}` } })
              .then((r) => r.json())
              .then((g) => { if (g) setChildGeo(g); })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [activeChild, token]);

  if (!activeChild) {
    return (
      <div className="max-w-[520px] mx-auto mt-10 w-full">
        <Card tone="glass" className="p-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck size={32} className="text-cyan-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2.5">Welcome to AlphaGuard AI</h2>
          <p className="text-slate-400 text-[13px] leading-relaxed max-w-[360px] mx-auto">
            Pair a child device or select an active profile from the header to begin.
          </p>
          <button
            onClick={() => navigate('/controls')}
            className="ag-tap mt-6 inline-flex items-center gap-2 px-6 min-h-[48px] bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full text-white font-black text-[13px] tracking-wide"
          >
            <Plus size={16} /> Set Up a Device
          </button>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-[3px] border-white/10 border-t-cyan-500 animate-spin" />
        <div className="text-slate-500 text-[12px] font-bold uppercase tracking-widest">Loading your family…</div>
      </div>
    );
  }

  const toggleDeviceLock = async () => {
    const currentLock = activeChild.deviceState === 'locked';
    const action = currentLock ? 'resume' : 'lock';
    setLockingDevice(true);
    setLockMsg(currentLock ? 'Unlocking…' : 'Locking…');
    try {
      const res = await fetch(`/api/device/control/${activeChild.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reason: action === 'lock' ? 'Locked by parent shortcut' : null }),
      });
      const d = await res.json();
      if (d.success) {
        setActiveChild({ ...activeChild, deviceState: currentLock ? 'active' : 'locked' });
        setLockMsg(currentLock ? 'Unlocked!' : 'Locked!');
      } else setLockMsg('Error');
    } catch { setLockMsg('Failed'); }
    setTimeout(() => { setLockingDevice(false); setLockMsg(''); }, 2000);
  };

  const triggerSOS = () => {
    setShowSosConfirm(false);
    const latestLoc = locations[locations.length - 1] || { latitude: 34.0522, longitude: -118.2437 };
    const payload = {
      lat: latestLoc.latitude, lon: latestLoc.longitude, childName: activeChild.name,
      reason: 'Parent initiated SOS via Dashboard', time: new Date().toISOString(),
    };
    window.dispatchEvent(new CustomEvent('incoming-command', { detail: { command: 'emergency', childId: activeChild.id, payload } }));
    navigate('/emergency');
  };

  const screenTimeMinutes = data.todayScreenTimeMinutes || 0;
  const limitMinutes = data.limitMinutes || 300;
  const screenTimePercentage = Math.min(100, Math.round((screenTimeMinutes / limitMinutes) * 100));
  const safetyScore = Math.max(30, Math.min(100, 100 - (screenTimeMinutes > limitMinutes ? Math.min(40, Math.round(((screenTimeMinutes - limitMinutes) / 60) * 12)) : 0) - (activeChild.deviceState === 'locked' ? 0 : 5)));

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safetyScore / 100) * circumference;
  const scoreLabel = safetyScore >= 90 ? 'Excellent' : safetyScore >= 75 ? 'Good' : safetyScore >= 60 ? 'Fair' : 'Needs attention';

  const latestLocation = locations[locations.length - 1];
  const mapCenter = latestLocation ? [latestLocation.latitude, latestLocation.longitude] : [34.0522, -118.2437];
  const isLocked = activeChild.deviceState === 'locked';
  const hrs = Math.floor(screenTimeMinutes / 60);
  const mins = screenTimeMinutes % 60;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[640px] mx-auto ag-rise">

      {/* Child status header card */}
      <Card tone="raised" className="p-4 flex items-center gap-3.5">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-2xl">
            🧒
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#12121c]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-black text-white truncate">{activeChild.name || 'Device'}</div>
          <div className="flex items-center gap-1.5 text-[12px] text-emerald-400 font-bold">
            <ShieldCheck size={13} /> Protected · Online
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.07]">
          <BatteryMedium size={14} className="text-cyan-400" />
          <span className="text-[12px] font-bold text-slate-200">
            {latestLocation?.battery != null ? `${latestLocation.battery}%` : '--'}
          </span>
        </div>
      </Card>

      {/* Family Safety Score — hero */}
      <div>
        <SectionLabel>Family Safety Score</SectionLabel>
        <Card tone="glass" className="p-5">
          <div className="flex items-center gap-5">
            <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
              <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                <circle cx="64" cy="64" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
                <circle cx="64" cy="64" r={radius} fill="transparent" stroke="url(#agScore)" strokeWidth="9"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.9s var(--ag-ease-out)' }} />
                <defs>
                  <linearGradient id="agScore" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-[34px] font-black text-white leading-none">{safetyScore}</span>
                <span className="text-[11px] font-bold text-cyan-400 mt-1">{scoreLabel}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-20 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={safetyScoreTrendData} margin={{ top: 8, bottom: 0, right: 6, left: 6 }}>
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0b0c14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: '#fff' }} itemStyle={{ color: '#06b6d4' }} />
                    <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-slate-400 font-semibold mt-1 px-1">
                <ShieldCheck size={13} className="text-cyan-400" /> All protections active this week
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="grid grid-cols-4 gap-2.5">
          <QuickAction icon={Navigation} label="Locate" color="#06b6d4" onClick={() => navigate('/location')} />
          <QuickAction icon={isLocked ? Unlock : Lock} label={lockMsg || (isLocked ? 'Resume' : 'Lock')} color={isLocked ? '#10b981' : '#8b5cf6'} onClick={toggleDeviceLock} disabled={lockingDevice} />
          <QuickAction icon={Phone} label="Call" color="#3b82f6" onClick={() => window.open(`tel:${activeChild.phone || ''}`, '_self')} />
          <QuickAction icon={Brain} label="AI" color="#a855f7" onClick={() => navigate('/ai-insights')} />
        </div>
      </div>

      {/* Live Location Summary */}
      <div>
        <SectionLabel action="Open map" onAction={() => navigate('/location')}>Live Location</SectionLabel>
        <Card padded={false} className="overflow-hidden">
          <div className="relative w-full h-44">
            <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%', zIndex: 10 }} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {latestLocation && <Marker position={[latestLocation.latitude, latestLocation.longitude]} icon={CHILD_ICON} />}
            </MapContainer>
            <div onClick={() => navigate('/location')} className="absolute inset-0 z-[20] flex items-end p-3 cursor-pointer">
              <div className="bg-[#0b0c14]/95 border border-white/10 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 backdrop-blur-md shadow-xl max-w-[92%]">
                <MapPin size={15} className="text-cyan-400 flex-shrink-0" />
                <div className="truncate">
                  <span className="text-slate-100 block font-bold text-[13px] leading-tight">
                    {childGeo?.displayName?.split(',')[0] || childGeo?.city || 'Secure location'}
                  </span>
                  <span className="text-slate-500 text-[11px]">Tap to open geofence map</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Screen Time Summary */}
      <div>
        <SectionLabel action="Details" onAction={() => navigate('/analytics')}>Screen Time Today</SectionLabel>
        <Card tone="glass" className="p-5">
          <div className="flex items-end justify-between mb-1">
            <div>
              <span className="text-[28px] font-black text-white leading-none">{hrs}h {mins}m</span>
              <span className="text-[12px] text-slate-500 font-semibold ml-2">of {Math.round(limitMinutes / 60)}h limit</span>
            </div>
            <span className={`text-[13px] font-black ${screenTimePercentage >= 100 ? 'text-rose-400' : 'text-cyan-400'}`}>{screenTimePercentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden mb-5">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-700" style={{ width: `${screenTimePercentage}%` }} />
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyScreenTimeData} margin={{ top: 5, bottom: 0, left: 6, right: 6 }}>
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0b0c14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#fff' }} itemStyle={{ color: '#8b5cf6' }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="hours" fill="url(#agBars)" radius={[5, 5, 0, 0]} />
                <defs>
                  <linearGradient id="agBars" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* AI Recommendations */}
      <div>
        <SectionLabel action="More" onAction={() => navigate('/ai-insights')}>AI Recommendations</SectionLabel>
        <Card tone="glass" className="p-4 flex flex-col gap-2.5">
          {[
            { icon: Sparkles, color: '#06b6d4', title: 'Set app-blocking triggers', body: 'Auto-pause social apps after the daily limit is reached.' },
            { icon: Clock, color: '#8b5cf6', title: 'Bedtime looks healthy', body: 'Screen time drops after 9pm — keep the current schedule.' },
          ].map((r) => (
            <button key={r.title} onClick={() => navigate('/ai-insights')} className="ag-tap flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}1f`, border: `1px solid ${r.color}40` }}>
                <r.icon size={17} style={{ color: r.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-white">{r.title}</div>
                <div className="text-[12px] text-slate-400 leading-snug mt-0.5">{r.body}</div>
              </div>
              <ChevronRight size={16} className="text-slate-600 flex-shrink-0 mt-1" />
            </button>
          ))}
        </Card>
      </div>

      {/* Emergency Access */}
      <div>
        <SectionLabel>Emergency</SectionLabel>
        <Card className="p-4 border-rose-500/20 bg-rose-500/[0.04]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSosConfirm(true)}
              className="ag-tap relative w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-red-600 text-white font-black flex items-center justify-center shadow-[0_0_24px_rgba(239,68,68,0.4)] border-4 border-[#0b0c14] flex-shrink-0"
            >
              <span className="absolute animate-ping inset-0 rounded-full bg-red-500/20" />
              <span className="relative z-10 text-[13px] tracking-widest">SOS</span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-black text-white">Emergency SOS</div>
              <div className="text-[12px] text-slate-400 leading-snug">Broadcast location & alert responders instantly.</div>
            </div>
            <button onClick={() => window.open('tel:911', '_self')} className="ag-tap flex flex-col items-center gap-1 px-3 py-2 rounded-2xl bg-white/[0.05] border border-white/[0.08]">
              <Phone size={16} className="text-rose-400" />
              <span className="text-[11px] font-bold text-slate-200">911</span>
            </button>
          </div>
        </Card>
      </div>

      <ConfirmationModal
        isOpen={showSosConfirm}
        onClose={() => setShowSosConfirm(false)}
        onConfirm={triggerSOS}
        title="Broadcast Emergency SOS?"
        message="This will instantly broadcast geo-location coordinates and notify emergency responders for this child."
        confirmText="Trigger SOS"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
};

export default Dashboard;
