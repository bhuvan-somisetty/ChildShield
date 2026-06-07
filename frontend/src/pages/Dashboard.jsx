import React, { useState, useEffect } from 'react';
import { Clock, Smartphone, User, Wifi, WifiOff, Brain, Heart, Activity, AlertTriangle, ShieldCheck, ChevronRight, Zap, Phone, Lock, Unlock, Navigation, MapPin } from 'lucide-react';
import { useLivePolling } from '../hooks/useLivePolling';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ConfirmationModal from '../components/layout/ConfirmationModal';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createEmoji = (emoji, size = 30) => L.divIcon({
  html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${emoji}</div>`,
  className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2]
});
const CHILD_ICON = createEmoji('🧒', 28);

const safetyScoreTrendData = [
  { name: 'Sun', score: 92 },
  { name: 'Mon', score: 94 },
  { name: 'Tue', score: 95 },
  { name: 'Wed', score: 91 },
  { name: 'Thu', score: 96 },
  { name: 'Fri', score: 98 },
  { name: 'Sat', score: 97 },
];

const weeklyScreenTimeData = [
  { name: 'Mon', hours: 1.5 },
  { name: 'Tue', hours: 2.2 },
  { name: 'Wed', hours: 2.8 },
  { name: 'Thu', hours: 1.8 },
  { name: 'Fri', hours: 2.0 },
  { name: 'Sat', hours: 3.5 },
  { name: 'Sun', hours: 2.4 },
];

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

  // Load locations for the Leaflet map preview
  useEffect(() => {
    if (activeChild && token) {
      fetch(`/api/device/locations/${activeChild.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.locations && d.locations.length > 0) {
          setLocations(d.locations);
          const latest = d.locations[d.locations.length - 1];
          // Reverse geocode to get readable address
          fetch(`/api/device/reverse-geocode?lat=${latest.latitude}&lon=${latest.longitude}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(r => r.json())
          .then(g => {
            if (g) setChildGeo(g);
          }).catch(() => {});
        }
      })
      .catch(() => {});
    }
  }, [activeChild, token]);

  if (!activeChild) {
    return (
      <div className="glass-card max-w-[600px] mx-auto mt-16 p-10 text-center border border-white/5 backdrop-blur-md shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
          <ShieldCheck size={32} className="text-[#06b6d4]" />
        </div>
        <h2 className="text-xl font-extrabold text-white mb-3 font-sans">Welcome to Family Safety OS</h2>
        <p className="text-slate-400 text-sm leading-relaxed max-w-[400px] mx-auto">
          Please pair a child device or select an active profile from the header to begin supervising activities.
        </p>
        <button 
          onClick={() => navigate('/controls')}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full text-white font-black text-xs tracking-wider uppercase cursor-pointer shadow-lg hover:opacity-90 transition-opacity"
        >
          Go to Device Setup
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-3 border-white/10 border-t-cyan-500 animate-spin" />
        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Loading Telemetry Core...</div>
      </div>
    );
  }

  const toggleDeviceLock = async () => {
    const currentLock = activeChild.deviceState === 'locked';
    const action = currentLock ? 'resume' : 'lock';
    setLockingDevice(true);
    setLockMsg(currentLock ? 'Unlocking...' : 'Locking...');

    try {
      const res = await fetch(`/api/device/control/${activeChild.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action, reason: action === 'lock' ? 'Locked by parent shortcut' : null })
      });
      const d = await res.json();
      if (d.success) {
        setActiveChild({ ...activeChild, deviceState: currentLock ? 'active' : 'locked' });
        setLockMsg(currentLock ? 'Unlocked!' : 'Locked!');
      } else {
        setLockMsg('Error');
      }
    } catch {
      setLockMsg('Failed');
    }
    setTimeout(() => {
      setLockingDevice(false);
      setLockMsg('');
    }, 2000);
  };

  const triggerSOS = () => {
    setShowSosConfirm(false);
    const latestLoc = locations[locations.length - 1] || { latitude: 34.0522, longitude: -118.2437 };
    const payload = {
      lat: latestLoc.latitude,
      lon: latestLoc.longitude,
      childName: activeChild.name,
      reason: 'Parent initiated SOS via Dashboard',
      time: new Date().toISOString()
    };
    window.dispatchEvent(new CustomEvent('incoming-command', {
      detail: { command: 'emergency', childId: activeChild.id, payload }
    }));
    navigate('/emergency');
  };

  const screenTimeMinutes = data.todayScreenTimeMinutes || 0;
  const limitMinutes = data.limitMinutes || 300;
  const screenTimePercentage = Math.round((screenTimeMinutes / limitMinutes) * 100);
  const safetyScore = Math.max(30, Math.min(100, 100 - (screenTimeMinutes > limitMinutes ? Math.min(40, Math.round(((screenTimeMinutes - limitMinutes) / 60) * 12)) : 0) - (activeChild.deviceState === 'locked' ? 0 : 5)));

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safetyScore / 100) * circumference;

  const latestLocation = locations[locations.length - 1];
  const mapCenter = latestLocation ? [latestLocation.latitude, latestLocation.longitude] : [34.0522, -118.2437];

  return (
    <div className="flex flex-col gap-5 px-3 pb-24 pt-4 w-full max-w-[960px] mx-auto animate-fade-in font-sans">
      
      {/* Sub-Header bar - Online heartbeats */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border border-white/5 rounded-full backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-200">
            {activeChild.name || 'Device'} (Shield Active)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">
          <Smartphone size={11} className="text-cyan-400" />
          <span>Battery: {latestLocation?.battery != null ? `${latestLocation.battery}%` : '--'}</span>
        </div>
      </div>

      {/* Family Safety Score Dial */}
      <div className="glass-card p-5 flex flex-col border border-white/5 backdrop-blur-xl shadow-lg rounded-[24px] bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Family Safety Index</h3>
          <span className="text-slate-500 text-xs cursor-pointer">···</span>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
            <svg width="112" height="112" viewBox="0 0 100 100" className="transform -rotate-90">
              <circle cx="50" cy="50" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
              <circle 
                cx="50" 
                cy="50" 
                r={radius} 
                fill="transparent" 
                stroke="url(#cyanBlueGrad)" 
                strokeWidth="6" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              />
              <defs>
                <linearGradient id="cyanBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-white">{safetyScore}</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Score</span>
            </div>
          </div>

          {/* Safety score trend chart */}
          <div className="flex-1 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safetyScoreTrendData} margin={{ top: 10, bottom: 5, right: 5, left: -25 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0b0c14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                  labelStyle={{ fontSize: '10px', color: '#fff' }}
                  itemStyle={{ fontSize: '10px', color: '#06b6d4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#4f46e5" 
                  strokeWidth={2.5} 
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protection Summary footer */}
        <div className="mt-4 pt-3.5 border-t border-white/5 flex flex-col gap-1">
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={12} /> Live Security Override Active
          </div>
          <p className="text-[11px] text-slate-400 leading-normal font-semibold">
            Telemetry links indicate local bounds are functional.
          </p>
        </div>
      </div>

      {/* Live Location Preview */}
      <div className="glass-card p-4 border border-white/5 backdrop-blur-xl shadow-lg rounded-[24px] bg-white/[0.02] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Live Location Radar</h3>
          <div className="flex items-center gap-1 text-[9px] text-slate-500 font-extrabold uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span>Heartbeat OK</span>
          </div>
        </div>

        {/* Leaflet map preview */}
        <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-1 border border-white/5">
          <MapContainer 
            center={mapCenter} 
            zoom={14} 
            style={{ height: '100%', width: '100%', zIndex: 10 }}
            zoomControl={false} 
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {latestLocation && (
              <Marker position={[latestLocation.latitude, latestLocation.longitude]} icon={CHILD_ICON} />
            )}
          </MapContainer>
          
          <div 
            onClick={() => navigate('/location')}
            className="absolute inset-0 bg-black/10 hover:bg-black/0 cursor-pointer z-[20] flex items-end p-3 transition-all duration-200"
          >
            <div className="bg-[#0b0c14]/95 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2 backdrop-blur-md shadow-2xl max-w-[90%]">
              <MapPin size={12} className="text-cyan-400 flex-shrink-0" />
              <div className="truncate text-[10px]">
                <span className="text-slate-300 block font-bold leading-none">
                  {childGeo?.displayName?.split(',')[0] || childGeo?.city || 'Secure Location'}
                </span>
                <span className="text-slate-500 text-[8.5px] mt-1 block leading-none">Tap to open geofence map</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights & Activity Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Left Column: Recommendations */}
        <div className="glass-card p-4 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Safety Briefing</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="p-2.5 bg-cyan-500/5 rounded-xl border-l-2 border-cyan-500">
              <span className="text-[9.5px] font-black text-cyan-400 block mb-0.5 uppercase tracking-wider">AI Advices</span>
              <span className="text-[10px] text-slate-300 leading-normal block font-semibold">
                Setup app blocking triggers.
              </span>
            </div>
            
            <div className="p-2.5 bg-purple-500/5 rounded-xl border-l-2 border-purple-500">
              <span className="text-[9.5px] font-black text-purple-400 block mb-0.5 uppercase tracking-wider">Limits Alert</span>
              <span className="text-[10px] text-slate-300 leading-normal block font-semibold">
                Time limits are active.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Daily Activity Timeline */}
        <div className="glass-card p-4 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Heartbeat Log</span>
          </div>

          <div className="flex flex-col gap-3 pl-1.5 relative border-l border-white/5 max-h-[140px] overflow-y-auto pr-1">
            {history.length > 0 ? (
              history.slice(0, 3).map((item, idx) => (
                <div key={item.id || idx} className="relative flex flex-col gap-0.5">
                  <span className="absolute -left-[10px] top-1 w-2 h-2 rounded-full bg-[#030307] border border-cyan-400 flex items-center justify-center">
                    <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                  </span>
                  <span className="text-[8px] text-slate-500 leading-none font-bold">{item.startTime || 'Just Now'}</span>
                  <span className="text-[9.5px] font-bold text-white leading-tight">
                    {item.app ? `Opened ${item.app}` : 'Device Synced'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[10px] text-slate-500 font-bold py-4 text-center">
                Waiting for telemetry...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screen Time Summary Chart */}
      <div className="glass-card p-4 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Screen Budget</h3>
          <span className="text-slate-500 text-xs">···</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] gap-4 items-center">
          {/* Bar chart */}
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyScreenTimeData} margin={{ top: 5, bottom: 5, left: -25, right: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0b0c14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                  labelStyle={{ fontSize: '10px', color: '#white' }}
                  itemStyle={{ fontSize: '10px', color: '#8b5cf6' }}
                />
                <Bar 
                  dataKey="hours" 
                  fill="url(#purpleCyanGrad)" 
                  radius={[3, 3, 0, 0]} 
                />
                <defs>
                  <linearGradient id="purpleCyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Allocation progress bars */}
          <div className="flex flex-col gap-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">Usage categories</span>
            {[
              { name: 'Social', time: `${Math.round(screenTimeMinutes * 0.4)}m`, percent: 65, color: 'bg-cyan-400' },
              { name: 'Games', time: `${Math.round(screenTimeMinutes * 0.35)}m`, percent: 45, color: 'bg-indigo-500' },
              { name: 'Education', time: `${Math.round(screenTimeMinutes * 0.25)}m`, percent: 30, color: 'bg-emerald-400' }
            ].map(app => (
              <div key={app.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[9.5px] font-semibold">
                  <span className="text-white">{app.name}</span>
                  <span className="text-slate-400">{app.time}</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${app.color}`} style={{ width: `${app.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Immediate action SOS & overrides bar */}
      <div className="glass-card p-4 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] shadow-lg grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        
        {/* Left call buttons */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => window.open(`tel:${activeChild.phone || ''}`, '_self')}
            className="py-3 px-3 bg-white/5 border border-white/5 text-[10px] text-white font-black uppercase tracking-wider rounded-xl cursor-pointer hover:bg-white/10 active:scale-95 transition-all text-center flex items-center justify-center gap-1"
          >
            <Phone size={11} className="text-cyan-400" />
            <span>Call Device</span>
          </button>
          
          <button 
            onClick={() => window.open('tel:911', '_self')}
            className="py-3 px-3 bg-white/5 border border-white/5 text-[10px] text-white font-black uppercase tracking-wider rounded-xl cursor-pointer hover:bg-white/10 active:scale-95 transition-all text-center flex items-center justify-center gap-1"
          >
            <Phone size={11} className="text-red-500" />
            <span>Call 911</span>
          </button>
        </div>

        {/* SOS button */}
        <button 
          onClick={() => setShowSosConfirm(true)}
          className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-red-600 text-white font-black text-xs flex items-center justify-center shadow-[0_0_24px_rgba(239,68,68,0.4)] border-4 border-[#0b0c14] active:scale-90 transition-transform cursor-pointer"
        >
          <span className="absolute animate-ping inset-0 rounded-full bg-red-500/20 opacity-75" />
          <span className="relative z-10 tracking-widest uppercase">SOS</span>
        </button>

        {/* Right tracking / lock shortcuts */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => navigate('/location')}
            className="py-3 px-3 bg-white/5 border border-white/5 text-[10px] text-white font-black uppercase tracking-wider rounded-xl cursor-pointer hover:bg-white/10 active:scale-95 transition-all text-center flex items-center justify-center gap-1"
          >
            <Navigation size={11} className="text-cyan-400" />
            <span>Locate</span>
          </button>
          
          <button 
            onClick={toggleDeviceLock}
            disabled={lockingDevice}
            className="py-3 px-3 bg-white/5 border border-white/5 text-[10px] text-white font-black uppercase tracking-wider rounded-xl cursor-pointer hover:bg-white/10 active:scale-95 transition-all text-center flex items-center justify-center gap-1"
          >
            {activeChild.deviceState === 'locked' ? (
              <>
                <Unlock size={11} className="text-emerald-400" />
                <span>{lockMsg || `Resume`}</span>
              </>
            ) : (
              <>
                <Lock size={11} className="text-cyan-400" />
                <span>{lockMsg || `Lock`}</span>
              </>
            )}
          </button>
        </div>

      </div>

      <ConfirmationModal 
        isOpen={showSosConfirm}
        onClose={() => setShowSosConfirm(false)}
        onConfirm={triggerSOS}
        title="Broadcast Emergency SOS?"
        message={`Are you sure you want to trigger a critical SOS distress alarm for this child profile? This will instantly broadcast geo-location coordinates and notify emergency responders.`}
        confirmText="Trigger SOS"
        cancelText="Cancel"
        isDestructive={true}
      />

    </div>
  );
};

export default Dashboard;
