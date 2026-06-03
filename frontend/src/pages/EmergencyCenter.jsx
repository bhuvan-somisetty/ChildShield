import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Phone, Shield, Plus, Trash2, Heart, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EmergencyCenter = () => {
  const { activeChild, token } = useAuth();
  const [coords, setCoords] = useState({ lat: 17.4063, lon: 78.4879, speed: '0 km/h', battery: '82%', accuracy: '12m' });
  const [facilities, setFacilities] = useState([]);
  const [facilityType, setFacilityType] = useState('hospital'); // 'hospital' | 'police'
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('emergency_contacts');
    return saved ? JSON.parse(saved) : [
      { name: 'Mother', phone: '+1 (555) 019-2834' },
      { name: 'Father', phone: '+1 (555) 019-5829' },
      { name: 'School Main Office', phone: '+1 (555) 012-9482' }
    ];
  });
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // 1. Fetch live coordinates or use current parent location if child coordinates not available
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
            speed: latest.speed ? `${Math.round(latest.speed * 3.6)} km/h` : '0 km/h',
            battery: latest.battery ? `${latest.battery}%` : '82%',
            accuracy: latest.accuracy ? `${Math.round(latest.accuracy)}m` : '12m'
          });
        } else {
          // Fall back to parent's current browser coordinates for real OSM results
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setCoords(prev => ({
                ...prev,
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                accuracy: `${Math.round(pos.coords.accuracy)}m`
              }));
            },
            () => {}
          );
        }
      })
      .catch(() => {});
    }
  }, [activeChild, token]);

  // 2. Fetch nearby hospitals/police stations based on coordinates
  useEffect(() => {
    if (!coords.lat || !coords.lon) return;
    setLoadingFacilities(true);
    fetch(`/api/device/nearby-facilities?lat=${coords.lat}&lon=${coords.lon}&type=${facilityType}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setFacilities(d.facilities || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFacilities(false));
  }, [coords.lat, coords.lon, facilityType]);

  // 3. Save emergency contacts
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

  // 4. Trigger SOS Alert simulation
  const triggerSOS = () => {
    const payload = {
      lat: coords.lat,
      lon: coords.lon,
      childName: activeChild?.name || 'Child',
      reason: 'Parent initiated SOS test',
      time: new Date().toISOString()
    };
    // Dispatch custom event to trigger local Parent dashboard audio/warning alarm system
    window.dispatchEvent(new CustomEvent('incoming-command', {
      detail: {
        command: 'emergency',
        childId: activeChild?.id,
        payload
      }
    }));
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '80px', paddingLeft: '16px', paddingRight: '16px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', marginBottom: '6px' }}>Unified Emergency Center</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Real-time distress tools, active family contacts, and surrounding emergency response locations.</p>
        <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(239,68,68,0.4), transparent)', marginTop: '20px' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* COLUMN 1: SOS PANIC & LIVE LOCATION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Pulsating SOS Button Card */}
          <div className="glass-card" style={{ padding: '32px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 0 30px rgba(239,68,68,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="#ef4444" /> Parent SOS Alert Trigger
            </h3>

            <button 
              onClick={triggerSOS}
              style={{
                width: '130px', height: '130px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                color: '#fff', border: '6px solid rgba(239,68,68,0.2)',
                fontWeight: '900', fontSize: '20px', cursor: 'pointer',
                margin: '0 auto 20px', display: 'block',
                boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)',
                animation: 'sosPulse 2s infinite',
                outline: 'none'
              }}
            >
              SOS
            </button>
            <style>{`
              @keyframes sosPulse {
                0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); transform: scale(1); }
                70% { box-shadow: 0 0 0 25px rgba(239, 68, 68, 0); transform: scale(1.05); }
                100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); transform: scale(1); }
              }
            `}</style>
            
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Tap to trigger a simulated distress override signal. This will test local dashboard warning speakers, trigger alarms, and activate Voice AI guidance loops.
            </p>
          </div>

          {/* Live Coordinates Details */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="var(--accent-cyan)" /> Live Location Coordinates
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Latitude</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{coords.lat.toFixed(5)}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Longitude</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{coords.lon.toFixed(5)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>GPS Accuracy:</span>
                <span style={{ fontWeight: '600' }}>{coords.accuracy}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Speed Vector:</span>
                <span style={{ fontWeight: '600' }}>{coords.speed}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Battery Status:</span>
                <span style={{ fontWeight: '600', color: coords.battery.startsWith('1') || coords.battery.startsWith('2') ? '#ef4444' : '#10b981' }}>{coords.battery}</span>
              </div>
            </div>
          </div>

        </div>

        {/* COLUMN 2: EMERGENCY CONTACTS & NEARBY FACILITIES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Emergency Contacts card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={18} color="var(--accent-cyan)" /> Family Emergency Lines
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {contacts.map((contact, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff', display: 'block' }}>{contact.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{contact.phone}</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveContact(idx)} 
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add contact form */}
            <form onSubmit={handleAddContact} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Name (e.g. Doctor)" 
                value={newContactName}
                onChange={e => setNewContactName(e.target.value)}
                style={{ flex: 1, minWidth: '100px', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
              <input 
                type="text" 
                placeholder="Phone Number" 
                value={newContactPhone}
                onChange={e => setNewContactPhone(e.target.value)}
                style={{ flex: 1, minWidth: '100px', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
              <button 
                type="submit"
                style={{ padding: '10px', background: 'var(--accent-cyan)', color: '#0f172a', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus size={16} />
              </button>
            </form>
          </div>

          {/* Nearby Facilities tabbed list */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--accent-purple)" /> Proximity Response Search
            </h3>

            {/* Proximity tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', marginBottom: '16px' }}>
              {[['hospital', '🏥 Hospitals'], ['police', '👮 Police Stations']].map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setFacilityType(type)}
                  style={{
                    flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s',
                    background: facilityType === type ? 'rgba(37,99,235,0.15)' : 'transparent',
                    color: facilityType === type ? '#2563eb' : 'var(--text-secondary)'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Facilities lists */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loadingFacilities ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Searching nearby maps...</div>
              ) : facilities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>No facilities found in proximity radius.</div>
              ) : (
                facilities.map((fac, idx) => (
                  <div key={idx} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
                      {fac.type === 'hospital' ? '🏥' : '👮'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fac.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fac.address}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-cyan)', flexShrink: 0 }}>{fac.distanceText}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default EmergencyCenter;
