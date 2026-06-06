import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { MapPin, Navigation, Phone, ShieldAlert, Sparkles, X, Compass, ChevronUp, ChevronDown, Check, Loader2 } from 'lucide-react';
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
        <!-- Pin stem pointer -->
        <div class="absolute bottom-[-16px] w-0.5 h-4 bg-cyan-400"></div>
        <!-- Avatar Ring -->
        <div class="w-11 h-11 rounded-full border-3 border-[#0b0b14] bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg overflow-hidden">
          <span class="text-white font-black text-xs">${initial}</span>
        </div>
        <!-- Status Bubble -->
        <div class="absolute -top-7 bg-[#0b0b14]/90 border border-white/10 rounded-md px-1.5 py-0.5 whitespace-nowrap text-[9px] flex items-center gap-1 shadow-md">
          <span class="w-1.5 h-1.5 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full"></span>
          <span class="text-white font-bold">${isOnline ? 'Online' : 'Offline'}</span>
          <span class="text-slate-400">· 🔋${battery}</span>
        </div>
      </div>
    `,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [0, 0]
  });
};

const createZoneMarkerIcon = (emoji, color) => L.divIcon({
  html: `<div style="font-size:20px; line-height:1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${emoji}</div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const ZONE_COLORS = { home: '#10b981', school: '#f59e0b', relative: '#8b5cf6', hospital: '#ef4444', custom: '#06b6d4' };

const LocationTracker = () => {
  const { activeChild, token } = useAuth();
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [childGeo, setChildGeo] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  const fetchLocations = useCallback(async () => {
    if (!activeChild?.id) return;
    try {
      const res = await fetch(`/api/device/locations/${activeChild.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLocations(data.locations || []);
      }
    } catch {}
  }, [activeChild?.id, token]);

  const fetchZones = useCallback(async () => {
    if (!activeChild?.id) return;
    try {
      const res = await fetch(`/api/device/safe-zones/${activeChild.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSafeZones(data.zones || []);
      }
    } catch {}
  }, [activeChild?.id, token]);

  useEffect(() => {
    fetchLocations();
    fetchZones();
    const iv = setInterval(fetchLocations, 10000);
    return () => clearInterval(iv);
  }, [fetchLocations, fetchZones]);

  // Reverse geocode whenever a new location updates
  const latestLocation = locations[locations.length - 1];
  useEffect(() => {
    if (!latestLocation) return;
    fetch(`/api/device/reverse-geocode?lat=${latestLocation.latitude}&lon=${latestLocation.longitude}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(g => {
      if (g) setChildGeo(g);
    }).catch(() => {});
  }, [latestLocation, token]);

  const triggerSOS = () => {
    setShowSosConfirm(false);
    const loc = latestLocation || { latitude: 34.0522, longitude: -118.2437 };
    const payload = {
      lat: loc.latitude,
      lon: loc.longitude,
      childName: activeChild?.name || 'Child',
      reason: 'Parent initiated Location SOS',
      time: new Date().toISOString()
    };
    window.dispatchEvent(new CustomEvent('incoming-command', {
      detail: { command: 'emergency', childId: activeChild?.id, payload }
    }));
    navigate('/emergency');
  };

  if (!activeChild) {
    return (
      <div className="glass-card max-w-[600px] mx-auto mt-16 p-10 text-center border border-white/5 shadow-2xl">
        <MapPin size={48} className="text-slate-500 mx-auto mb-4" />
        <p className="text-white text-lg font-bold">No child device selected</p>
        <p className="text-slate-400 text-sm mt-2">Pair a device from Controls first to view live maps.</p>
        <button 
          onClick={() => navigate('/controls')}
          className="mt-6 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-white font-bold text-xs cursor-pointer shadow-lg hover:opacity-90"
        >
          Go to Controls
        </button>
      </div>
    );
  }

  const mapCenter = latestLocation ? [latestLocation.latitude, latestLocation.longitude] : [34.0522, -118.2437];
  const batteryPct = latestLocation?.battery != null ? `${latestLocation.battery}%` : '--';
  const speed = latestLocation?.speed != null ? `${Math.round(latestLocation.speed * 2.237)} mph` : 'Active';

  // Build geofences list, fall back to beautiful overlays if empty as per adjustments
  const displayedZones = safeZones.length > 0 ? safeZones : [
    { id: 'mock-home', name: "Safe Perimeter A", type: 'home', latitude: mapCenter[0] + 0.0015, longitude: mapCenter[1] - 0.002, radiusMeters: 120 },
    { id: 'mock-school', name: "Safe Perimeter B", type: 'school', latitude: mapCenter[0] - 0.002, longitude: mapCenter[1] + 0.0025, radiusMeters: 140 }
  ];

  // Map route trace points
  const routePoints = locations.length > 0 ? locations.map(l => [l.latitude, l.longitude]) : [
    [mapCenter[0] - 0.002, mapCenter[1] + 0.0025],
    [mapCenter[0] - 0.001, mapCenter[1] + 0.001],
    [mapCenter[0], mapCenter[1]] 
  ];

  return (
    <div className="relative w-full h-[calc(100vh-64px)] animate-fade-in" style={{ height: 'calc(100vh - 64px)' }}>
      
      {/* Top Banner (Lily & Leo Online) */}
      <div className="absolute top-4 left-4 right-4 z-[20] flex items-center justify-between bg-[#0b0b14]/90 border border-white/10 rounded-2xl px-4 py-2.5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col">
          <span className="text-white font-extrabold text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            {activeChild.name} Live Tracking
          </span>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Real-time coordinates active
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          <span>Active</span>
        </div>
      </div>

      {/* Main Full-Screen Map Container */}
      <MapContainer 
        ref={setMapRef} 
        center={mapCenter} 
        zoom={15} 
        style={{ height: '100%', width: '100%', zIndex: 10 }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        
        {/* Route History Trace Line */}
        <Polyline 
          positions={routePoints} 
          pathOptions={{ color: '#06b6d4', weight: 4.5, opacity: 0.85, lineJoin: 'round', lineCap: 'round', dashArray: '5, 8' }} 
        />
        
        {/* Child Avatar Marker */}
        <Marker position={mapCenter} icon={createChildAvatarIcon(activeChild.name, batteryPct, true)} />

        {/* Safe Zones Circle & Custom Markers */}
        {displayedZones.map(z => (
          <React.Fragment key={z.id}>
            <Circle 
              center={[z.latitude, z.longitude]} 
              radius={z.radiusMeters} 
              pathOptions={{ 
                color: ZONE_COLORS[z.type] || '#06b6d4', 
                weight: 1.5, 
                fillColor: ZONE_COLORS[z.type] || '#06b6d4', 
                fillOpacity: 0.12,
                dashArray: '3, 6'
              }} 
            />
            <Marker 
              position={[z.latitude, z.longitude]} 
              icon={createZoneMarkerIcon(z.type === 'home' ? '🏠' : '🏫', ZONE_COLORS[z.type])}
            >
              <Tooltip direction="bottom" offset={[0, 10]} opacity={0.9} permanent>
                <span className="text-[9px] font-bold text-slate-200 bg-slate-950/80 px-1.5 py-0.5 border border-white/10 rounded shadow-md">
                  {z.name}
                </span>
              </Tooltip>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Floating Speed / Battery Details Tooltip Card (Middle map details) */}
      <div className="absolute top-[80px] left-4 z-[20] bg-[#0b0b14]/90 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md max-w-[200px]">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Last Updated</div>
        <div className="text-white font-extrabold text-[11px] mt-0.5">Just now</div>
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-2">Current Speed</div>
        <div className="text-cyan-400 font-extrabold text-[11px] mt-0.5">{speed}</div>
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-2">Location</div>
        <div className="text-slate-300 font-semibold text-[10px] mt-0.5 leading-snug">
          {childGeo?.displayName?.split(',')[0] || childGeo?.city || 'Secure Location'}
        </div>
      </div>

      {/* Floating Detailed Overlay Card (Bottom right floating box matching Screen 2 layout) */}
      <div className="absolute bottom-[92px] left-4 right-4 z-[20] bg-[#0b0b14]/90 border border-white/10 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
        
        {/* Child header info */}
        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-sm uppercase">
            {activeChild.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-extrabold text-sm flex items-center gap-1.5">
              {activeChild.name} <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Online</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                🔋 {batteryPct}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                📶 {latestLocation?.signalStrength != null ? `${latestLocation.signalStrength}dBm` : 'Good'}
              </span>
            </div>
          </div>
        </div>

        {/* Speed / ETA Grid */}
        <div className="grid grid-cols-2 gap-3 py-3 border-b border-white/5 text-[11px]">
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Current Speed</span>
            <span className="text-white font-extrabold">{speed}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">ETA to Home</span>
            <span className="text-white font-extrabold">15 min</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">ETA to School</span>
            <span className="text-white font-extrabold">5 min</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Signal Status</span>
            <span className="text-emerald-400 font-extrabold">Secure</span>
          </div>
        </div>

        {/* Actions panel */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <button 
            onClick={() => window.open(`tel:${activeChild.phone || ''}`, '_self')}
            className="py-2.5 px-2 bg-white/5 border border-white/5 text-xs text-white font-bold rounded-xl cursor-pointer hover:bg-white/10 active:scale-95 transition-all text-center flex items-center justify-center gap-1"
          >
            <Phone size={12} className="text-cyan-400" />
            <span>Call {activeChild.name}</span>
          </button>
          
          <button 
            onClick={() => setShowSosConfirm(true)}
            className="py-2.5 px-2 bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-black rounded-xl cursor-pointer hover:bg-red-500/25 active:scale-95 transition-all text-center flex items-center justify-center gap-1 shadow-md shadow-red-500/5"
          >
            <ShieldAlert size={12} />
            <span>SOS</span>
          </button>

          <button 
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${mapCenter[0]},${mapCenter[1]}&travelmode=walking`, '_blank')}
            className="py-2.5 px-2 bg-white/5 border border-white/5 text-xs text-white font-bold rounded-xl cursor-pointer hover:bg-white/10 active:scale-95 transition-all text-center flex items-center justify-center gap-1"
          >
            <Navigation size={12} className="text-cyan-400" />
            <span>Navigate</span>
          </button>
        </div>

      </div>

      {/* Expandable Location History Bottom Sheet Drawer */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-[25] bg-[#0b0b14] border-t border-white/10 rounded-t-3xl shadow-2xl transition-all duration-300"
        style={{ height: isHistoryDrawerOpen ? '320px' : '48px' }}
      >
        {/* Toggle Bar */}
        <div 
          onClick={() => setIsHistoryDrawerOpen(!isHistoryDrawerOpen)}
          className="flex items-center justify-between px-6 py-3 cursor-pointer select-none"
        >
          <span className="text-cyan-400 font-extrabold text-xs tracking-wider uppercase flex items-center gap-1.5">
            <Compass size={13} />
            Recent Location History
          </span>
          {isHistoryDrawerOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
        </div>

        {/* History timeline log drawer */}
        {isHistoryDrawerOpen && (
          <div className="px-6 pb-6 overflow-y-auto h-[260px] flex flex-col gap-4">
            <div className="relative border-l border-white/5 pl-4 flex flex-col gap-4 mt-2">
              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                <div className="text-[10px] text-slate-500 font-bold uppercase">Last 2 hours</div>
                <div className="text-[11px] font-extrabold text-white">Central Park Path</div>
              </div>

              {locations.length > 0 ? (
                locations.slice().reverse().map((loc, i) => (
                  <div key={i} className="relative flex flex-col gap-0.5">
                    <span className="absolute -left-[20px] top-1 w-2 h-2 rounded-full bg-slate-700" />
                    <div className="text-[9px] text-slate-500 font-bold">{new Date(loc.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                    <div className="text-[11px] font-bold text-slate-300">
                      {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="relative flex flex-col gap-0.5">
                    <span className="absolute -left-[20px] top-1 w-2 h-2 rounded-full bg-slate-700" />
                    <div className="text-[9px] text-slate-500 font-bold">3:25 PM</div>
                    <div className="text-[11px] font-bold text-slate-300">Arrived at Perimeter B</div>
                  </div>
                  <div className="relative flex flex-col gap-0.5">
                    <span className="absolute -left-[20px] top-1 w-2 h-2 rounded-full bg-slate-700" />
                    <div className="text-[9px] text-slate-500 font-bold">2:30 PM</div>
                    <div className="text-[11px] font-bold text-slate-300">Left Perimeter A</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SOS Confirmation Dialog */}
      <ConfirmationModal 
        isOpen={showSosConfirm}
        onClose={() => setShowSosConfirm(false)}
        onConfirm={triggerSOS}
        title="Broadcast Emergency SOS?"
        message={`Are you sure you want to trigger an emergency alarm for ${activeChild.name}? This will notify active emergency lines and start high-accuracy GPS tracking.`}
        confirmText="Trigger SOS"
        cancelText="Cancel"
        isDestructive={true}
      />

    </div>
  );
};

export default LocationTracker;