import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { MapPin, Navigation, Phone, ShieldAlert, Compass, ChevronUp, ChevronDown } from 'lucide-react';
import ConfirmationModal from '../components/layout/ConfirmationModal';
import { useNavigate } from 'react-router-dom';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createChildAvatarIcon = (name = 'Device', battery = '--', isOnline = true) => {
  const initial = name.charAt(0).toUpperCase();
  return L.divIcon({
    html: `
      <div class="relative flex flex-col items-center" style="transform: translate(-50%, -50%);">
        <div class="absolute bottom-[-16px] w-0.5 h-4 bg-cyan-400"></div>
        <div class="w-11 h-11 rounded-full border-[3px] border-[#0b0b14] bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg overflow-hidden">
          <span class="text-white font-black text-xs">${initial}</span>
        </div>
        <div class="absolute -top-7 bg-[#0b0b14]/90 border border-white/10 rounded-md px-1.5 py-0.5 whitespace-nowrap text-[10px] flex items-center gap-1 shadow-md">
          <span class="w-1.5 h-1.5 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full"></span>
          <span class="text-white font-bold">${isOnline ? 'Online' : 'Offline'}</span>
          <span class="text-slate-400">· 🔋${battery}</span>
        </div>
      </div>`,
    className: '', iconSize: [40, 40], iconAnchor: [0, 0],
  });
};
const createZoneMarkerIcon = (emoji) => L.divIcon({
  html: `<div style="font-size:20px; line-height:1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${emoji}</div>`,
  className: '', iconSize: [24, 24], iconAnchor: [12, 12],
});
const ZONE_COLORS = { home: '#10b981', school: '#f59e0b', relative: '#8b5cf6', hospital: '#ef4444', custom: '#06b6d4' };

const LocationTracker = () => {
  const { activeChild, token } = useAuth();
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [childGeo, setChildGeo] = useState(null);
  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  const fetchLocations = useCallback(async () => {
    if (!activeChild?.id) return;
    try {
      const res = await fetch(`/api/device/locations/${activeChild.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setLocations(data.locations || []);
    } catch {}
  }, [activeChild?.id, token]);

  const fetchZones = useCallback(async () => {
    if (!activeChild?.id) return;
    try {
      const res = await fetch(`/api/device/safe-zones/${activeChild.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSafeZones(data.zones || []);
    } catch {}
  }, [activeChild?.id, token]);

  useEffect(() => {
    fetchLocations();
    fetchZones();
    const iv = setInterval(fetchLocations, 10000);
    return () => clearInterval(iv);
  }, [fetchLocations, fetchZones]);

  const latestLocation = locations[locations.length - 1];
  useEffect(() => {
    if (!latestLocation) return;
    fetch(`/api/device/reverse-geocode?lat=${latestLocation.latitude}&lon=${latestLocation.longitude}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((g) => { if (g) setChildGeo(g); })
      .catch(() => {});
  }, [latestLocation, token]);

  const triggerSOS = () => {
    setShowSosConfirm(false);
    const loc = latestLocation || { latitude: 34.0522, longitude: -118.2437 };
    const payload = { lat: loc.latitude, lon: loc.longitude, childName: activeChild?.name || 'Child', reason: 'Parent initiated Location SOS', time: new Date().toISOString() };
    window.dispatchEvent(new CustomEvent('incoming-command', { detail: { command: 'emergency', childId: activeChild?.id, payload } }));
    navigate('/emergency');
  };

  if (!activeChild) {
    return (
      <div className="max-w-[520px] mx-auto mt-10 w-full">
        <div className="rounded-[22px] bg-[#0b0c14] border border-white/[0.06] p-8 text-center">
          <MapPin size={44} className="text-slate-500 mx-auto mb-4" />
          <p className="text-white text-lg font-black">No child device selected</p>
          <p className="text-slate-400 text-[13px] mt-2">Pair a device from Controls to view live maps.</p>
          <button onClick={() => navigate('/controls')} className="ag-tap mt-6 px-6 min-h-[48px] inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-white font-black text-[13px]">
            Go to Controls
          </button>
        </div>
      </div>
    );
  }

  const mapCenter = latestLocation ? [latestLocation.latitude, latestLocation.longitude] : [34.0522, -118.2437];
  const batteryPct = latestLocation?.battery != null ? `${latestLocation.battery}%` : '--';
  const speed = latestLocation?.speed != null ? `${Math.round(latestLocation.speed * 2.237)} mph` : 'Active';

  const displayedZones = safeZones.length > 0 ? safeZones : [
    { id: 'mock-home', name: 'Home', type: 'home', latitude: mapCenter[0] + 0.0015, longitude: mapCenter[1] - 0.002, radiusMeters: 120 },
    { id: 'mock-school', name: 'School', type: 'school', latitude: mapCenter[0] - 0.002, longitude: mapCenter[1] + 0.0025, radiusMeters: 140 },
  ];
  const routePoints = locations.length > 0 ? locations.map((l) => [l.latitude, l.longitude]) : [
    [mapCenter[0] - 0.002, mapCenter[1] + 0.0025], [mapCenter[0] - 0.001, mapCenter[1] + 0.001], [mapCenter[0], mapCenter[1]],
  ];

  // Full-bleed map that fills the space between the fixed navbar and bottom nav.
  return (
    <div
      className="fixed left-0 right-0 z-[15]"
      style={{
        top: 'calc(60px + var(--ag-safe-top))',
        bottom: 'calc(64px + var(--ag-safe-bottom))',
      }}
    >
      {/* Top status banner */}
      <div className="absolute top-3 left-3 right-3 z-[20] flex items-center justify-between bg-[#0b0b14]/90 border border-white/10 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-md">
        <div className="flex flex-col">
          <span className="text-white font-black text-[14px] flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> {activeChild.name}
          </span>
          <span className="text-[11px] text-slate-400 font-semibold mt-0.5">Live tracking active</span>
        </div>
        <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">Online</span>
      </div>

      <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%', zIndex: 10 }} zoomControl={false} attributionControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <Polyline positions={routePoints} pathOptions={{ color: '#06b6d4', weight: 4.5, opacity: 0.85, lineJoin: 'round', lineCap: 'round', dashArray: '5, 8' }} />
        <Marker position={mapCenter} icon={createChildAvatarIcon(activeChild.name, batteryPct, true)} />
        {displayedZones.map((z) => (
          <React.Fragment key={z.id}>
            <Circle center={[z.latitude, z.longitude]} radius={z.radiusMeters}
              pathOptions={{ color: ZONE_COLORS[z.type] || '#06b6d4', weight: 1.5, fillColor: ZONE_COLORS[z.type] || '#06b6d4', fillOpacity: 0.12, dashArray: '3, 6' }} />
            <Marker position={[z.latitude, z.longitude]} icon={createZoneMarkerIcon(z.type === 'home' ? '🏠' : '🏫')}>
              <Tooltip direction="bottom" offset={[0, 10]} opacity={0.9} permanent>
                <span className="text-[10px] font-bold text-slate-200">{z.name}</span>
              </Tooltip>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Detail overlay card */}
      <div className="absolute bottom-[60px] left-3 right-3 z-[20] bg-[#0b0b14]/92 border border-white/10 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-base uppercase">
            {activeChild.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-black text-[15px] flex items-center gap-2">
              {activeChild.name}
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Online</span>
            </div>
            <div className="text-[12px] text-slate-400 font-semibold mt-0.5 truncate">
              {childGeo?.displayName?.split(',')[0] || childGeo?.city || 'Secure location'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 py-3 text-[13px]">
          {[['Speed', speed, 'text-white'], ['Battery', batteryPct, 'text-white'], ['ETA Home', '15 min', 'text-white'], ['Signal', 'Secure', 'text-emerald-400']].map(([k, v, c]) => (
            <div key={k} className="flex flex-col">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wide">{k}</span>
              <span className={`font-black ${c}`}>{v}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-1">
          <button onClick={() => window.open(`tel:${activeChild.phone || ''}`, '_self')}
            className="ag-tap py-3 bg-white/[0.05] border border-white/[0.07] text-[12.5px] text-white font-bold rounded-2xl flex items-center justify-center gap-1.5">
            <Phone size={14} className="text-cyan-400" /> Call
          </button>
          <button onClick={() => setShowSosConfirm(true)}
            className="ag-tap py-3 bg-rose-500/10 border border-rose-500/25 text-[12.5px] text-rose-400 font-black rounded-2xl flex items-center justify-center gap-1.5">
            <ShieldAlert size={14} /> SOS
          </button>
          <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${mapCenter[0]},${mapCenter[1]}&travelmode=walking`, '_blank')}
            className="ag-tap py-3 bg-white/[0.05] border border-white/[0.07] text-[12.5px] text-white font-bold rounded-2xl flex items-center justify-center gap-1.5">
            <Navigation size={14} className="text-cyan-400" /> Go
          </button>
        </div>
      </div>

      {/* History drawer */}
      <div className="absolute bottom-0 left-0 right-0 z-[25] bg-[#0b0b14] border-t border-white/10 rounded-t-3xl shadow-2xl transition-all duration-300"
        style={{ height: isHistoryDrawerOpen ? '300px' : '52px' }}>
        <button onClick={() => setIsHistoryDrawerOpen(!isHistoryDrawerOpen)} className="ag-tap w-full flex items-center justify-between px-6 py-4">
          <span className="text-cyan-400 font-black text-[12.5px] tracking-wide flex items-center gap-2">
            <Compass size={15} /> Location History
          </span>
          {isHistoryDrawerOpen ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronUp size={18} className="text-slate-400" />}
        </button>
        {isHistoryDrawerOpen && (
          <div className="px-6 pb-6 overflow-y-auto ag-no-scrollbar h-[240px]">
            <div className="relative border-l border-white/[0.08] pl-4 flex flex-col gap-4 mt-1">
              {locations.length > 0 ? (
                locations.slice().reverse().map((loc, i) => (
                  <div key={i} className="relative flex flex-col gap-0.5">
                    <span className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <div className="text-[11px] text-slate-500 font-bold">{new Date(loc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-[13px] font-bold text-slate-200">{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</div>
                  </div>
                ))
              ) : (
                <div className="text-[13px] text-slate-500 py-4">Waiting for location history…</div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showSosConfirm}
        onClose={() => setShowSosConfirm(false)}
        onConfirm={triggerSOS}
        title="Broadcast Emergency SOS?"
        message={`Trigger an emergency alarm for ${activeChild.name}? This notifies emergency lines and starts high-accuracy GPS tracking.`}
        confirmText="Trigger SOS"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
};

export default LocationTracker;
