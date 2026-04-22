import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, Navigation, Search, Trash2, Plus, Home, GraduationCap, Users, MapPinned,
  X, User, Save, Loader2, Layers, Maximize2, LocateFixed
} from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createEmoji = (emoji, size = 36) => L.divIcon({
  html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4))">${emoji}</div>`,
  className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2]
});

const createZoneIcon = (type) => {
  const icons = { home: '🏠', school: '🏫', relative: '👨‍👩‍👧', hospital: '🏥', custom: '📍' };
  return createEmoji(icons[type] || '📍', 28);
};

const CHILD_ICON = createEmoji('📍', 32);
const PARENT_ICON = createEmoji('🧑', 32);
const PIN_ICON = createEmoji('📍', 36);
const ZONE_COLORS = { home: '#10b981', school: '#3b82f6', relative: '#f59e0b', hospital: '#ef4444', custom: '#8b5cf6' };
const DEFAULT_RADIUS = 80;

const MAP_TILES = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  street: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDist = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatTravelTime = (mins) => {
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${Math.round(mins)} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = Math.round(mins % 60);
  return `${hrs}h ${remMins}m`;
};

const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [positions, map]);
  return null;
};

const MapClickHandler = ({ onMapClick, enabled }) => {
  useMapEvents({
    click: (e) => {
      if (enabled && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

const LocationTracker = () => {
  const { activeChild, token } = useAuth();
  const childId = activeChild?.id;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [tab, setTab] = useState('live');
  const [locations, setLocations] = useState([]);
  const [childGeo, setChildGeo] = useState(null);
  const [parentPos, setParentPos] = useState(null);
  const [parentGeo, setParentGeo] = useState(null);
  const [safeZones, setSafeZones] = useState([]);
  const [mapRef, setMapRef] = useState(null);
  const [mapType, setMapType] = useState('dark');
  const [showAddZone, setShowAddZone] = useState(false);
  const [showMapControls, setShowMapControls] = useState(false);
  const [newZone, setNewZone] = useState({ name: '', type: 'home', latitude: null, longitude: null, address: '' });
  const [zoneSearchQuery, setZoneSearchQuery] = useState('');
  const [zoneSearchResults, setZoneSearchResults] = useState([]);
  const [isSearchingZone, setIsSearchingZone] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [savingZone, setSavingZone] = useState(false);
  const lastGeoRef = useRef({ child: '', parent: '' });
  const searchTimeoutRef = useRef(null);

  const latest = locations[0];
  const distance = latest && parentPos ? haversine(latest.latitude, latest.longitude, parentPos.lat, parentPos.lng) : null;

  const centerOnChild = useCallback(() => {
    if (mapRef && latest) mapRef.flyTo([latest.latitude, latest.longitude], 16, { duration: 1 });
  }, [mapRef, latest]);

  const centerOnParent = useCallback(() => {
    if (mapRef && parentPos) mapRef.flyTo([parentPos.lat, parentPos.lng], 16, { duration: 1 });
  }, [mapRef, parentPos]);

  const fetchLocations = useCallback(async () => {
    if (!childId) return;
    try {
      const res = await fetch(`/api/device/locations/${childId}`, { headers });
      const data = await res.json();
      if (data.success) setLocations(data.locations || []);
    } catch { }
  }, [childId, token]);

  const fetchZones = useCallback(async () => {
    if (!childId) return;
    try {
      const res = await fetch(`/api/device/safe-zones/${childId}`, { headers });
      const data = await res.json();
      if (data.success) setSafeZones(data.zones || []);
    } catch { }
  }, [childId, token]);

  const searchPlaces = async (query) => {
    if (!query || query.length < 2) return setZoneSearchResults([]);
    setIsSearchingZone(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
      const data = await res.json();
      setZoneSearchResults(data || []);
    } catch (e) { setZoneSearchResults([]); }
    setIsSearchingZone(false);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setZoneSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchPlaces(value), 400);
  };

  const reverseGeocode = useCallback(async (lat, lon) => {
    try {
      const res = await fetch(`/api/device/reverse-geocode?lat=${lat}&lon=${lon}`, { headers });
      return await res.json();
    } catch { return null; }
  }, [token]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const wid = navigator.geolocation.watchPosition(
      (pos) => setParentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, []);

  useEffect(() => {
    fetchLocations();
    fetchZones();
    const iv = setInterval(fetchLocations, 15000);
    return () => clearInterval(iv);
  }, [fetchLocations, fetchZones]);

  useEffect(() => {
    if (!latest) return;
    const key = `${latest.latitude.toFixed(4)},${latest.longitude.toFixed(4)}`;
    if (lastGeoRef.current.child === key) return;
    lastGeoRef.current.child = key;
    reverseGeocode(latest.latitude, latest.longitude).then(g => g && setChildGeo(g));
  }, [latest, reverseGeocode]);

  useEffect(() => {
    if (!parentPos) return;
    const key = `${parentPos.lat.toFixed(4)},${parentPos.lng.toFixed(4)}`;
    if (lastGeoRef.current.parent === key) return;
    lastGeoRef.current.parent = key;
    reverseGeocode(parentPos.lat, parentPos.lng).then(g => g && setParentGeo(g));
  }, [parentPos, reverseGeocode]);

  const handleDeleteZone = async (zoneId) => {
    try {
      await fetch(`/api/device/safe-zones/${zoneId}`, { method: 'DELETE', headers });
      fetchZones();
    } catch { }
  };

  const handleAddZone = async () => {
    if (!newZone.name || !newZone.latitude || !newZone.longitude) return;
    setSavingZone(true);
    try {
      await fetch('/api/device/safe-zones', {
        method: 'POST', headers,
        body: JSON.stringify({
          ...newZone,
          childId,
          latitude: parseFloat(newZone.latitude),
          longitude: parseFloat(newZone.longitude),
          radiusMeters: DEFAULT_RADIUS
        })
      });
      fetchZones();
      setShowAddZone(false);
      setNewZone({ name: '', type: 'home', latitude: null, longitude: null, address: '' });
      setZoneSearchQuery('');
      setZoneSearchResults([]);
      setPinMode(false);
      setTab('live');
    } catch { }
    setSavingZone(false);
  };

  const useMyLocation = () => {
    if (parentPos) {
      setNewZone(z => ({ ...z, latitude: parentPos.lat, longitude: parentPos.lng }));
      reverseGeocode(parentPos.lat, parentPos.lng).then(g => {
        if (g) setNewZone(z => ({ ...z, address: g.displayName || '' }));
      });
      setPinMode(false);
      setZoneSearchQuery('');
      setZoneSearchResults([]);
    }
  };

  const handleMapPinDrop = async (lat, lon) => {
    if (!pinMode) return;
    setNewZone(z => ({ ...z, latitude: lat, longitude: lon }));
    setPinMode(false);
    const geo = await reverseGeocode(lat, lon);
    if (geo) {
      setNewZone(z => ({ ...z, address: geo.displayName || '' }));
    }
  };

  const handleSelectSearchResult = (res) => {
    setNewZone(z => ({ ...z, latitude: parseFloat(res.lat), longitude: parseFloat(res.lon), address: res.display_name }));
    setZoneSearchResults([]);
    setZoneSearchQuery(res.display_name.split(',')[0]);
    if (mapRef) mapRef.flyTo([res.lat, res.lon], 17);
  };



  const mapPositions = [];
  if (latest) mapPositions.push([latest.latitude, latest.longitude]);
  if (parentPos) mapPositions.push([parentPos.lat, parentPos.lng]);
  const routePoints = locations.map(l => [l.latitude, l.longitude]);
  const center = latest ? [latest.latitude, latest.longitude] : parentPos ? [parentPos.lat, parentPos.lng] : [20.5937, 78.9629];

  if (!childId) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#475569', textAlign: 'center', padding: '20px' }}>
      <div>
        <MapPin size={48} color="#334155" style={{ marginBottom: '16px' }} />
        <p style={{ fontSize: '16px' }}>No child device selected</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>Pair a device from Controls first</p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'live', label: 'Live' },
    { id: 'history', label: 'History' },
    { id: 'zones', label: 'Zones' }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px 40px' }}>
      <style>{`
        .leaflet-bar a { background-color: #0f172a !important; color: #10b981 !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 8px !important; }
        .leaflet-bar a:hover { background-color: #1e293b !important; color: #34d399 !important; }
        .leaflet-control-zoom { border: none !important; margin: 16px !important; }
        @media (max-width: 768px) {
          .location-grid { grid-template-columns: 1fr !important; }
          .location-info { display: flex !important; flex-direction: column !important; }
        }
      `}</style>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>Location</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{activeChild?.name}'s real-time location</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', border: 'none', background: tab === t.id ? 'rgba(0,240,255,0.15)' : 'transparent', color: tab === t.id ? '#00f0ff' : '#64748b', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'live' && (
        <div className="location-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
          <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', height: '500px' }}>
            {distance !== null && (
              <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 1000, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '16px', minWidth: '160px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>DISTANCE</div>
                  <div style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', background: distance < 50 ? 'rgba(16,185,129,0.2)' : distance < 500 ? 'rgba(59,130,246,0.2)' : distance < 5000 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', color: distance < 50 ? '#10b981' : distance < 500 ? '#3b82f6' : distance < 5000 ? '#f59e0b' : '#ef4444' }}>
                    {distance < 50 ? 'NEARBY' : distance < 500 ? 'WALKING' : distance < 5000 ? 'FAR' : 'VERY FAR'}
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#00f0ff' }}>{formatDist(distance)}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                  🚗 {formatTravelTime(distance / 1000)} · 🚶 {formatTravelTime(distance / 80)}
                </div>
              </div>
            )}

            <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => setShowMapControls(!showMapControls)} style={{ width: '40px', height: '40px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={18} color="#94a3b8" />
              </button>
              {showMapControls && (
                <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {['dark', 'street', 'satellite'].map(type => (
                    <button key={type} onClick={() => { setMapType(type); setShowMapControls(false); }} style={{ padding: '8px 12px', background: mapType === type ? 'rgba(0,240,255,0.15)' : 'transparent', border: 'none', borderRadius: '8px', color: mapType === type ? '#00f0ff' : '#94a3b8', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize' }}>
                      {type}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => parentPos ? centerOnParent() : null} style={{ width: '40px', height: '40px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LocateFixed size={18} color={parentPos ? '#3b82f6' : '#475569'} />
              </button>
              <button onClick={centerOnChild} style={{ width: '40px', height: '40px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Navigation size={18} color="#10b981" />
              </button>
            </div>

            {pinMode && (
              <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(139, 92, 246, 0.95)', padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="#fff" />
                <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>Tap on map to set location</span>
                <button onClick={() => setPinMode(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: '8px' }}>
                  <X size={18} color="#fff" />
                </button>
              </div>
            )}

            <MapContainer ref={setMapRef} center={center} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={true} attributionControl={false}>
              <TileLayer url={MAP_TILES[mapType]} />
              <MapClickHandler onMapClick={handleMapPinDrop} enabled={pinMode} />
              {mapPositions.length > 0 && <FitBounds positions={mapPositions} />}
              {latest && parentPos && <Polyline positions={[[parentPos.lat, parentPos.lng], [latest.latitude, latest.longitude]]} pathOptions={{ color: '#00f0ff', weight: 3, dashArray: '5, 10', opacity: 0.6 }} />}
              {latest && <Marker position={[latest.latitude, latest.longitude]} icon={CHILD_ICON}><Popup><strong>{activeChild?.name}</strong><br />{formatTime(latest.timestamp)}</Popup></Marker>}
              {parentPos && <Marker position={[parentPos.lat, parentPos.lng]} icon={PARENT_ICON}><Popup><strong>You</strong></Popup></Marker>}
              {safeZones.map(z => (
                <React.Fragment key={z.id}>
                  <Marker position={[z.latitude, z.longitude]} icon={createZoneIcon(z.type)}>
                    <Popup><strong>{z.name}</strong><br />{z.type}</Popup>
                  </Marker>
                </React.Fragment>
              ))}
              {safeZones.map(z => (
                <Circle key={`circle-${z.id}`} center={[z.latitude, z.longitude]} radius={z.radiusMeters || DEFAULT_RADIUS} pathOptions={{ color: ZONE_COLORS[z.type] || '#8b5cf6', weight: 2, fillOpacity: 0.15, fillColor: ZONE_COLORS[z.type] || '#8b5cf6' }} />
              ))}
            </MapContainer>
          </div>

          <div className="location-info" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', cursor: latest ? 'pointer' : 'default' }} onClick={centerOnChild}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={20} color="#10b981" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{activeChild?.name}</div>
                  <div style={{ fontSize: '12px', color: latest ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                    {latest ? 'Tracking Active' : 'Offline'}
                  </div>
                </div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: latest ? '#10b981' : '#ef4444', boxShadow: latest ? '0 0 8px #10b981' : 'none' }} />
              </div>
              {latest ? (
                <div style={{ paddingLeft: '52px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>{childGeo?.city || childGeo?.locality || 'Unknown location'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{formatTime(latest.timestamp)}</div>
                </div>
              ) : (
                <div style={{ paddingLeft: '52px', fontSize: '13px', color: '#64748b' }}>Waiting for location...</div>
              )}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="#3b82f6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>You</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Parent location</div>
                </div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: parentPos ? '#3b82f6' : '#ef4444' }} />
              </div>
              <div style={{ paddingLeft: '52px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{parentGeo?.city || parentGeo?.locality || (parentPos ? 'Getting location...' : 'Enable location')}</div>
              </div>
            </div>

            {latest && parentPos && (
              <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${parentPos.lat},${parentPos.lng}&destination=${latest.latitude},${latest.longitude}&travelmode=driving`, '_blank')} style={{ padding: '14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '14px', color: '#10b981', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Navigation size={18} /> Navigate to {activeChild?.name}
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
          {locations.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <MapPin size={48} color="#334155" style={{ marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>No route history</div>
              <div style={{ fontSize: '14px', color: '#475569' }}>Location data will appear when GPS tracking is active</div>
            </div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {locations.map((loc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: i === 0 ? '#10b981' : '#475569', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      {formatTime(loc.timestamp)} {loc.battery != null && `· 🔋 ${loc.battery}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'zones' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{safeZones.length} saved place{safeZones.length !== 1 ? 's' : ''}</span>
            <button onClick={() => setShowAddZone(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '12px', color: '#00f0ff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
              <Plus size={16} /> Add Place
            </button>
          </div>

          {showAddZone && (
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px 24px 0 0', zIndex: 9999, maxHeight: '85vh', overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Add New Place</span>
                <button onClick={() => { setShowAddZone(false); setPinMode(false); setZoneSearchResults([]); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={24} color="#64748b" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input
                  placeholder="Place name (e.g. Home, School, Aunt's House)"
                  value={newZone.name}
                  onChange={e => setNewZone(z => ({ ...z, name: e.target.value }))}
                  style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none' }}
                />

                <div style={{ display: 'flex', gap: '8px' }}>
                  {['home', 'school', 'relative', 'hospital', 'custom'].map(t => (
                    <button key={t} onClick={() => setNewZone(z => ({ ...z, type: t }))} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: `1px solid ${newZone.type === t ? ZONE_COLORS[t] : 'rgba(255,255,255,0.1)'}`, background: newZone.type === t ? `${ZONE_COLORS[t]}15` : 'transparent', color: newZone.type === t ? ZONE_COLORS[t] : '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize' }}>
                      {t === 'home' ? '🏠 Home' : t === 'school' ? '🏫 School' : t === 'relative' ? '👨‍👩‍👧 Relative' : t === 'hospital' ? '🏥 Hospital' : '📍 Custom'}
                    </button>
                  ))}
                </div>

                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', marginBottom: '12px' }}>How would you like to set the location?</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => { setPinMode(true); setZoneSearchResults([]); setZoneSearchQuery(''); }} style={{ padding: '14px', background: pinMode ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                      <MapPinned size={20} color="#8b5cf6" />
                      <span>{pinMode ? 'Tap on map to select...' : 'Pick on map'}</span>
                    </button>
                    <button onClick={useMyLocation} disabled={!parentPos} style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: parentPos ? '#fff' : '#475569', fontSize: '14px', fontWeight: '500', cursor: parentPos ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                      <LocateFixed size={20} color={parentPos ? '#3b82f6' : '#475569'} />
                      <span>Use my current location</span>
                    </button>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', marginBottom: '8px' }}>Or search for a place</div>
                    <div style={{ position: 'relative' }}>
                      <input
                        placeholder="Search schools, hospitals, parks, homes..."
                        value={zoneSearchQuery}
                        onChange={handleSearchChange}
                        style={{ width: '100%', padding: '12px 16px', paddingLeft: '40px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none' }}
                      />
                      <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                      {isSearchingZone && <Loader2 size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: '#00f0ff', animation: 'spin 1s linear infinite' }} />}
                    </div>
                    {zoneSearchResults.length > 0 && (
                      <div style={{ position: 'absolute', left: '0', right: '0', marginTop: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden', zIndex: 10 }}>
                        {zoneSearchResults.map((res, i) => (
                          <div key={i} onClick={() => handleSelectSearchResult(res)} style={{ padding: '12px 16px', fontSize: '14px', color: '#cbd5e1', cursor: 'pointer', borderBottom: '1px solid #334155' }} onMouseOver={e => e.currentTarget.style.background = '#334155'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                            {res.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {newZone.latitude && newZone.longitude && (
                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MapPin size={20} color="#10b981" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>Location set</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{newZone.address || 'Custom location'}</div>
                    </div>
                  </div>
                )}

                <button onClick={handleAddZone} disabled={!newZone.name || !newZone.latitude || savingZone} style={{ padding: '16px', background: !newZone.name || !newZone.latitude || savingZone ? '#334155' : '#10b981', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: '700', fontSize: '15px', cursor: !newZone.name || !newZone.latitude || savingZone ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {savingZone ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={20} />}
                  {savingZone ? 'Saving...' : 'Save Place'}
                </button>
              </div>
            </div>
          )}

          {safeZones.length === 0 && !showAddZone ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '60px 24px', textAlign: 'center' }}>
              <MapPinned size={48} color="#334155" style={{ marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>No saved places</div>
              <div style={{ fontSize: '14px', color: '#475569' }}>Add Home, School, or other places to create safe zones</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {safeZones.map(z => {
                const col = ZONE_COLORS[z.type] || '#8b5cf6';
                const icons = { home: '🏠', school: '🏫', relative: '👨‍👩‍👧', hospital: '🏥', custom: '📍' };
                return (
                  <div key={z.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '28px' }}>{icons[z.type] || '📍'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{z.name}</div>
                      <div style={{ fontSize: '12px', color: col, marginTop: '2px' }}>{z.type}</div>
                      {z.address && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.address}</div>}
                    </div>
                    <button onClick={() => handleDeleteZone(z.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px', cursor: 'pointer' }}>
                      <Trash2 size={18} color="#ef4444" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LocationTracker;