import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Phone, Shield, Plus, Trash2, Heart, Activity, ShieldCheck, RefreshCw, Signal, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ConfirmationModal from '../components/layout/ConfirmationModal';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createEmoji = (emoji, size = 26) => L.divIcon({
  html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${emoji}</div>`,
  className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2]
});
const CHILD_ALERT_ICON = createEmoji('🚨', 24);

const EmergencyCenter = () => {
  const { activeChild, childrenList, token } = useAuth();
  const [coords, setCoords] = useState({ lat: 34.0522, lon: -118.2437, speed: 'Active', battery: '--', accuracy: '--' });
  const [facilities, setFacilities] = useState([]);
  const [facilityType, setFacilityType] = useState('hospital'); // 'hospital' | 'police'
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('emergency_contacts');
    return saved ? JSON.parse(saved) : [
      { name: 'Primary Guard A', phone: '****-***-***' },
      { name: 'Primary Guard B', phone: '****-***-***' }
    ];
  });

  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Fetch locations for active child
  useEffect(() => {
    if (activeChild && token) {
      fetch(`/api/device/locations/${activeChild.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.locations && d.locations.length > 0) {
          const latest = d.locations[d.locations.length - 1];
          setCoords({
            lat: parseFloat(latest.latitude),
            lon: parseFloat(latest.longitude),
            speed: latest.speed ? `${Math.round(latest.speed * 2.237)} mph` : 'Active',
            battery: latest.battery ? `${latest.battery}%` : '--',
            accuracy: latest.accuracy ? `${Math.round(latest.accuracy)}m` : '--'
          });
        }
      })
      .catch(() => {});
    }
  }, [activeChild, token, refreshKey]);

  // Fetch nearby OSM facilities
  useEffect(() => {
    if (!coords.lat || !coords.lon) return;
    setLoadingFacilities(true);
    fetch(`/api/device/nearby-facilities?lat=${coords.lat}&lon=${coords.lon}&type=${facilityType}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setFacilities(d.facilities || []);
      })
      .catch(() => {})
      .finally(() => setLoadingFacilities(false));
  }, [coords.lat, coords.lon, facilityType, refreshKey]);

  const handleAddContact = (e) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    const updated = [...contacts, { name: newContactName, phone: newContactPhone }];
    setContacts(updated);
    localStorage.setItem('emergency_contacts', JSON.stringify(updated));
    setNewContactName('');
    setNewContactPhone('');
  };

  const handleRemoveContact = (idx) => {
    const updated = contacts.filter((_, i) => i !== idx);
    setContacts(updated);
    localStorage.setItem('emergency_contacts', JSON.stringify(updated));
  };

  const triggerSOS = () => {
    setShowSosConfirm(false);
    const payload = {
      lat: coords.lat,
      lon: coords.lon,
      childName: activeChild?.name || 'Child',
      reason: 'Parent triggered SOS panic button',
      time: new Date().toISOString()
    };
    window.dispatchEvent(new CustomEvent('incoming-command', {
      detail: { command: 'emergency', childId: activeChild?.id, payload }
    }));
  };

  // Compile real status summaries dynamically from the child list
  const kidsSummary = childrenList && childrenList.length > 0 ? childrenList.map(child => {
    const isAlert = child.deviceState === 'locked';
    return {
      name: child.name,
      status: isAlert ? 'WARNING' : 'SAFE',
      battery: child.battery != null ? `${child.battery}%` : '--',
      signal: isAlert ? 'Low Alert' : 'Active',
      color: isAlert ? 'text-amber-400' : 'text-emerald-400'
    };
  }) : [
    { name: 'Companion Device A', status: 'SAFE', battery: '--', signal: 'Active', color: 'text-emerald-400' }
  ];

  // Overall family state (Safe, Warning, Emergency)
  const isSOSActive = activeChild?.deviceState === 'locked';
  const overallState = isSOSActive ? 'EMERGENCY' : (kidsSummary.some(k => k.status === 'WARNING') ? 'WARNING' : 'SAFE');
  const overallColor = overallState === 'EMERGENCY' ? 'from-red-600 to-rose-600 border-red-500/30 text-white' : overallState === 'WARNING' ? 'from-amber-600 to-yellow-600 border-amber-500/30 text-white' : 'from-emerald-600 to-teal-600 border-emerald-500/30 text-white';

  return (
    <div className="flex flex-col gap-5 px-3 pb-24 pt-4 max-w-[640px] mx-auto animate-fade-in font-sans">
      
      {/* Header title */}
      <div className="text-center mb-1">
        <h2 className="text-base font-black text-white uppercase tracking-wider">Emergency Monitor</h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
          Active distress monitoring & quick response lines
        </p>
      </div>

      {/* FAMILY STATUS OVERVIEW */}
      <div className={`p-5 rounded-[24px] border bg-gradient-to-tr ${overallColor} shadow-xl flex flex-col items-center justify-center text-center gap-2`}>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Family Status State</span>
        <h3 className="text-3xl font-black tracking-tight">{overallState}</h3>
        <p className="text-[10.5px] opacity-75 font-semibold max-w-[280px]">
          {overallState === 'EMERGENCY' ? 'Active distress override triggered. Immediate response advised.' : 'All synchronized devices are linked and reporting safety.'}
        </p>
      </div>

      {/* Device List Status Deck */}
      <div className="glass-card p-4 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] shadow-lg flex flex-col">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          Linked Devices Status
        </div>
        <div className="flex flex-col gap-3">
          {kidsSummary.map((kid, idx) => (
            <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-2.5 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[11px] font-black uppercase">
                  {kid.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-white">{kid.name}</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase">
                <span className={kid.color}>{kid.status}</span>
                <span className="text-slate-400">🔋 {kid.battery}</span>
                <span className="text-slate-400 flex items-center gap-0.5">
                  <Signal size={10} className="text-cyan-400" /> {kid.signal}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pulsing SOS Panic Button Card */}
      <div className="glass-card p-6 border border-red-500/15 backdrop-blur-xl rounded-[24px] bg-white/[0.02] shadow-xl flex flex-col items-center justify-center text-center">
        <button 
          onClick={() => setShowSosConfirm(true)}
          className="w-24 h-24 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-red-600 text-white font-black text-xs tracking-wider flex flex-col items-center justify-center shadow-[0_0_35px_rgba(239,68,68,0.55)] border-4 border-[#0b0c14] active:scale-95 transition-transform cursor-pointer"
        >
          <span className="text-xs font-black leading-none block uppercase tracking-wider">Trigger SOS</span>
        </button>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-4 leading-normal max-w-[320px]">
          Tap to trigger confirmation modal. Broadcasting distress overrides child device mute systems.
        </p>
      </div>

      {/* LIVE GPS COORDINATES */}
      <div className="glass-card p-4 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] shadow-lg flex flex-col">
        <div className="flex items-center justify-between mb-3.5">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Last GPS Coordinates
          </div>
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="p-1 hover:bg-white/5 rounded text-slate-400 cursor-pointer"
          >
            <RefreshCw size={11} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <MapPin size={16} />
          </div>
          <div className="text-xs">
            <span className="text-slate-400">Current:</span>{' '}
            <span className="text-white font-extrabold">
              Lat: {coords.lat.toFixed(4)}° N, Lon: {Math.abs(coords.lon).toFixed(4)}° W
            </span>
          </div>
        </div>
      </div>

      {/* PRIMARY EMERGENCY CONTACTS */}
      <div className="glass-card p-4 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] shadow-lg flex flex-col">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          Emergency Contacts List
        </div>
        <div className="flex flex-col gap-2.5">
          {contacts.map((contact, idx) => (
            <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-2.5 last:border-b-0 last:pb-0">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-white">{contact.name}</span>
                <span className="text-[10px] text-slate-500">{contact.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open(`tel:${contact.phone.replace(/[^\d+]/g, '')}`, '_self')}
                  className="py-1.5 px-3 bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold rounded-lg text-[10px] cursor-pointer hover:bg-red-500/20"
                >
                  Call
                </button>
                <button 
                  onClick={() => handleRemoveContact(idx)} 
                  className="p-1.5 hover:bg-white/5 rounded text-slate-500 hover:text-red-500 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          {/* Responder Direct Call shortcuts */}
          <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Local Police</span>
              <span className="text-[9px] text-slate-500">911 line speed-dial</span>
            </div>
            <button 
              onClick={() => window.open('tel:911', '_self')}
              className="py-1.5 px-3 bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold rounded-lg text-[10px] cursor-pointer hover:bg-red-500/20"
            >
              Call 911
            </button>
          </div>
        </div>

        {/* Add custom contact form */}
        <form onSubmit={handleAddContact} className="flex gap-2 mt-4 pt-3 border-t border-white/5">
          <input 
            type="text" 
            placeholder="Contact Name" 
            value={newContactName}
            onChange={e => setNewContactName(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[#0b0c14] border border-white/5 rounded-lg text-white text-xs outline-none focus:border-cyan-500/30"
          />
          <input 
            type="text" 
            placeholder="Phone Number" 
            value={newContactPhone}
            onChange={e => setNewContactPhone(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[#0b0c14] border border-white/5 rounded-lg text-white text-xs outline-none focus:border-cyan-500/30"
          />
          <button 
            type="submit" 
            className="px-3 bg-cyan-500 rounded-lg text-slate-950 font-bold text-xs flex items-center justify-center cursor-pointer hover:opacity-90"
          >
            Add
          </button>
        </form>
      </div>

      {/* MINI LIVE MAP */}
      <div className="glass-card p-4 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] shadow-lg flex flex-col">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          Mini Live Map
        </div>
        <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-white/5">
          <MapContainer 
            center={[coords.lat, coords.lon]} 
            zoom={14} 
            style={{ height: '100%', width: '100%', zIndex: 10 }}
            zoomControl={false} 
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <Marker position={[coords.lat, coords.lon]} icon={CHILD_ALERT_ICON} />
          </MapContainer>
        </div>
      </div>

      {/* NEARBY EMERGENCY SERVICES */}
      <div className="glass-card p-4 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] shadow-lg flex flex-col">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          Nearby Emergency Responders
        </div>
        
        {/* Toggle options */}
        <div className="flex gap-2 mb-3 bg-white/5 p-1 rounded-lg">
          {[['hospital', '🏥 Hospitals'], ['police', '👮 Police Stations']].map(([type, label]) => (
            <button 
              key={type}
              onClick={() => setFacilityType(type)}
              className={`flex-1 py-1 text-center font-bold text-[10px] rounded-md cursor-pointer transition-all ${facilityType === type ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-400'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
          {loadingFacilities ? (
            <div className="text-center py-4 text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1.5">
              <Loader2 className="animate-spin" size={12} /> Searching surrounding responders...
            </div>
          ) : facilities.length === 0 ? (
            <div className="text-center py-4 text-[10px] text-slate-500">No emergency facilities detected.</div>
          ) : (
            facilities.slice(0, 3).map((fac, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-white leading-tight truncate max-w-[180px]">{fac.name}</span>
                  <span className="text-[9px] text-slate-500 leading-none mt-0.5 truncate max-w-[180px]">{fac.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] font-black text-cyan-400">{fac.distanceText}</span>
                  <button 
                    onClick={() => window.open(`tel:${fac.phone ? fac.phone : '911'}`, '_self')}
                    className="py-1 px-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-extrabold rounded text-[9px] cursor-pointer hover:bg-cyan-500/20"
                  >
                    Call
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SOS confirmation dialog overlay */}
      <ConfirmationModal 
        isOpen={showSosConfirm}
        onClose={() => setShowSosConfirm(false)}
        onConfirm={triggerSOS}
        title="Broadcast Emergency SOS?"
        message={`Are you sure you want to broadcast a distress signal? This tests speaker alarms, sends geo-signals to contacts, and alerts response staff.`}
        confirmText="Trigger SOS"
        cancelText="Cancel"
        isDestructive={true}
      />

    </div>
  );
};

export default EmergencyCenter;
