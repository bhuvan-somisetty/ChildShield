import React, { useState, useEffect } from 'react';
import { MapPin, Trash2, RefreshCw, Signal, Loader2, Phone, Plus, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ConfirmationModal from '../components/layout/ConfirmationModal';
import { Card } from '../components/ui';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
const createEmoji = (emoji, size = 26) => L.divIcon({
  html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${emoji}</div>`,
  className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
});
const CHILD_ALERT_ICON = createEmoji('🚨', 24);

const SectionLabel = ({ children, right }) => (
  <div className="flex items-center justify-between mb-3 px-1">
    <h3 className="text-[13px] font-black text-white tracking-tight">{children}</h3>
    {right}
  </div>
);

const EmergencyCenter = () => {
  const { activeChild, childrenList, token } = useAuth();
  const [coords, setCoords] = useState({ lat: 34.0522, lon: -118.2437, speed: 'Active', battery: '--', accuracy: '--' });
  const [facilities, setFacilities] = useState([]);
  const [facilityType, setFacilityType] = useState('hospital');
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('emergency_contacts');
    return saved ? JSON.parse(saved) : [
      { name: 'Primary Guardian', phone: '****-***-***' },
      { name: 'Secondary Guardian', phone: '****-***-***' },
    ];
  });
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  useEffect(() => {
    if (activeChild && token) {
      fetch(`/api/device/locations/${activeChild.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.locations && d.locations.length > 0) {
            const latest = d.locations[d.locations.length - 1];
            setCoords({
              lat: parseFloat(latest.latitude), lon: parseFloat(latest.longitude),
              speed: latest.speed ? `${Math.round(latest.speed * 2.237)} mph` : 'Active',
              battery: latest.battery ? `${latest.battery}%` : '--',
              accuracy: latest.accuracy ? `${Math.round(latest.accuracy)}m` : '--',
            });
          }
        })
        .catch(() => {});
    }
  }, [activeChild, token, refreshKey]);

  useEffect(() => {
    if (!coords.lat || !coords.lon) return;
    setLoadingFacilities(true);
    fetch(`/api/device/nearby-facilities?lat=${coords.lat}&lon=${coords.lon}&type=${facilityType}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setFacilities(d.facilities || []); })
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
      lat: coords.lat, lon: coords.lon, childName: activeChild?.name || 'Child',
      reason: 'Parent triggered SOS panic button', time: new Date().toISOString(),
    };
    window.dispatchEvent(new CustomEvent('incoming-command', { detail: { command: 'emergency', childId: activeChild?.id, payload } }));
  };

  const kidsSummary = childrenList && childrenList.length > 0 ? childrenList.map((child) => {
    const isAlert = child.deviceState === 'locked';
    return {
      name: child.name, status: isAlert ? 'WARNING' : 'SAFE',
      battery: child.battery != null ? `${child.battery}%` : '--',
      signal: isAlert ? 'Low Alert' : 'Active', color: isAlert ? 'text-amber-400' : 'text-emerald-400',
    };
  }) : [{ name: 'Companion Device', status: 'SAFE', battery: '--', signal: 'Active', color: 'text-emerald-400' }];

  const isSOSActive = activeChild?.deviceState === 'locked';
  const overallState = isSOSActive ? 'EMERGENCY' : (kidsSummary.some((k) => k.status === 'WARNING') ? 'WARNING' : 'SAFE');
  const stateStyles = {
    EMERGENCY: { grad: 'from-red-600 to-rose-600', border: 'border-red-500/40', icon: AlertTriangle },
    WARNING: { grad: 'from-amber-500 to-yellow-600', border: 'border-amber-500/40', icon: AlertTriangle },
    SAFE: { grad: 'from-emerald-600 to-teal-600', border: 'border-emerald-500/40', icon: ShieldCheck },
  }[overallState];
  const StateIcon = stateStyles.icon;

  return (
    <div className="flex flex-col gap-5 w-full max-w-[640px] mx-auto ag-rise">

      {/* Family status banner */}
      <div className={`p-6 rounded-[26px] border bg-gradient-to-tr ${stateStyles.grad} ${stateStyles.border} shadow-xl text-white text-center flex flex-col items-center gap-2`}>
        <StateIcon size={28} className="opacity-90" />
        <span className="text-[11px] font-black uppercase tracking-[0.16em] opacity-85">Family Status</span>
        <h2 className="text-3xl font-black tracking-tight">{overallState}</h2>
        <p className="text-[12.5px] opacity-85 font-semibold max-w-[290px] leading-relaxed">
          {overallState === 'EMERGENCY'
            ? 'Active distress override triggered. Immediate response advised.'
            : 'All linked devices are reporting safe and online.'}
        </p>
      </div>

      {/* Linked devices */}
      <div>
        <SectionLabel>Linked Devices</SectionLabel>
        <Card tone="raised" className="p-4 flex flex-col gap-3">
          {kidsSummary.map((kid, idx) => (
            <div key={idx} className="flex items-center justify-between py-1 border-b border-white/[0.05] last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 text-sm font-black uppercase">
                  {kid.name.charAt(0)}
                </div>
                <div>
                  <div className="text-[13.5px] font-bold text-white">{kid.name}</div>
                  <div className={`text-[11px] font-black uppercase tracking-wide ${kid.color}`}>{kid.status}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-slate-300 font-bold">
                <span>🔋 {kid.battery}</span>
                <span className="flex items-center gap-1"><Signal size={12} className="text-cyan-400" /> {kid.signal}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* SOS panic */}
      <Card className="p-7 border-rose-500/20 bg-rose-500/[0.04] flex flex-col items-center text-center">
        <button
          onClick={() => setShowSosConfirm(true)}
          className="ag-tap relative w-28 h-28 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-red-600 text-white flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.55)] border-4 border-[#0b0c14]"
        >
          <span className="absolute inset-0 rounded-full animate-ping bg-red-500/20" />
          <span className="relative z-10 text-[15px] font-black tracking-widest">SOS</span>
        </button>
        <p className="text-[12.5px] text-slate-400 font-semibold mt-5 max-w-[320px] leading-relaxed">
          Broadcasting overrides the child device’s mute and alerts your emergency contacts instantly.
        </p>
      </Card>

      {/* GPS + map */}
      <div>
        <SectionLabel right={
          <button onClick={() => setRefreshKey((p) => p + 1)} className="ag-tap flex items-center gap-1 text-[12px] font-bold text-cyan-400">
            <RefreshCw size={13} /> Refresh
          </button>
        }>Live Location</SectionLabel>
        <Card padded={false} className="overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
              <MapPin size={18} />
            </div>
            <div className="text-[13px]">
              <span className="text-slate-500">Coordinates</span>
              <div className="text-white font-bold">{coords.lat.toFixed(4)}° N, {Math.abs(coords.lon).toFixed(4)}° W</div>
            </div>
          </div>
          <div className="relative w-full h-40">
            <MapContainer center={[coords.lat, coords.lon]} zoom={14} style={{ height: '100%', width: '100%', zIndex: 10 }} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              <Marker position={[coords.lat, coords.lon]} icon={CHILD_ALERT_ICON} />
            </MapContainer>
          </div>
        </Card>
      </div>

      {/* Emergency contacts */}
      <div>
        <SectionLabel>Emergency Contacts</SectionLabel>
        <Card tone="raised" className="p-4 flex flex-col gap-2.5">
          {contacts.map((contact, idx) => (
            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-white/[0.05]">
              <div>
                <div className="text-[13.5px] font-bold text-white">{contact.name}</div>
                <div className="text-[11.5px] text-slate-500">{contact.phone}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.open(`tel:${contact.phone.replace(/[^\d+]/g, '')}`, '_self')}
                  className="ag-tap flex items-center gap-1.5 py-2 px-3.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 font-bold rounded-xl text-[12px]">
                  <Phone size={13} /> Call
                </button>
                <button onClick={() => handleRemoveContact(idx)} className="ag-tap p-2 text-slate-500 hover:text-rose-400">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between py-1.5 border-t border-white/[0.06] pt-3">
            <div>
              <div className="text-[13.5px] font-bold text-white">Emergency Services</div>
              <div className="text-[11.5px] text-slate-500">911 speed-dial</div>
            </div>
            <button onClick={() => window.open('tel:911', '_self')}
              className="ag-tap flex items-center gap-1.5 py-2 px-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 font-black rounded-xl text-[12px]">
              <Phone size={13} /> 911
            </button>
          </div>

          <form onSubmit={handleAddContact} className="flex gap-2 mt-3 pt-3 border-t border-white/[0.06]">
            <input type="text" placeholder="Name" value={newContactName} onChange={(e) => setNewContactName(e.target.value)}
              className="flex-1 min-w-0 px-3 min-h-[46px] bg-[#0b0c14] border border-white/[0.08] rounded-xl text-white text-[14px] outline-none focus:border-cyan-500/40" />
            <input type="tel" placeholder="Phone" value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)}
              className="flex-1 min-w-0 px-3 min-h-[46px] bg-[#0b0c14] border border-white/[0.08] rounded-xl text-white text-[14px] outline-none focus:border-cyan-500/40" />
            <button type="submit" className="ag-tap flex items-center justify-center w-12 min-h-[46px] bg-cyan-500 rounded-xl text-slate-950">
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </form>
        </Card>
      </div>

      {/* Nearby responders */}
      <div>
        <SectionLabel>Nearby Responders</SectionLabel>
        <Card tone="raised" className="p-4">
          <div className="flex gap-1.5 mb-3 bg-white/[0.04] p-1 rounded-2xl">
            {[['hospital', '🏥 Hospitals'], ['police', '👮 Police']].map(([type, label]) => (
              <button key={type} onClick={() => setFacilityType(type)}
                className={`ag-tap flex-1 py-2.5 text-center font-bold text-[12.5px] rounded-xl transition-all ${facilityType === type ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-400'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto ag-no-scrollbar">
            {loadingFacilities ? (
              <div className="text-center py-5 text-[12px] text-slate-500 font-semibold flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={14} /> Searching nearby responders…
              </div>
            ) : facilities.length === 0 ? (
              <div className="text-center py-5 text-[12px] text-slate-500">No facilities detected nearby.</div>
            ) : (
              facilities.slice(0, 4).map((fac, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-white truncate max-w-[190px]">{fac.name}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[190px]">{fac.address}</div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-[12px] font-black text-cyan-400">{fac.distanceText}</span>
                    <button onClick={() => window.open(`tel:${fac.phone ? fac.phone : '911'}`, '_self')}
                      className="ag-tap py-1.5 px-3 bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 font-bold rounded-xl text-[11px]">
                      Call
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <ConfirmationModal
        isOpen={showSosConfirm}
        onClose={() => setShowSosConfirm(false)}
        onConfirm={triggerSOS}
        title="Broadcast Emergency SOS?"
        message="This sends geo-signals to your contacts, triggers the device alarm, and alerts response services."
        confirmText="Trigger SOS"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
};

export default EmergencyCenter;
