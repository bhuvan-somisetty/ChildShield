import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Moon, Satellite, Map as MapIcon, LocateFixed } from 'lucide-react';

const DEFAULT = [30.2672, -97.7431]; // Austin fallback [lat, lng]

// maxNativeZoom = highest zoom the provider serves; Leaflet upscales beyond it
// instead of showing "map data not available".
const VIEWS = {
  Dark: { label: 'Dark', icon: Moon, layers: [{ url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', sub: 'abcd', maxNative: 19 }] },
  Satellite: { label: 'Satellite', icon: Satellite, layers: [
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxNative: 18 },
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', maxNative: 18 },
  ] },
  Street: { label: 'Street', icon: MapIcon, layers: [{ url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', sub: 'abcd', maxNative: 19 }] },
};

const pIcon = () => L.divIcon({ className: '', iconSize: [44, 56], iconAnchor: [22, 50], html:
  `<div style="display:flex;flex-direction:column;align-items:center"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(140deg,#6366f1,#2563eb);border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;box-shadow:0 0 18px rgba(79,70,229,.7)">J</div><div style="margin-top:2px;font-size:10px;font-weight:900;color:#fff;background:rgba(0,0,0,.6);padding:1px 6px;border-radius:8px">You</div></div>` });
const cIcon = (c) => L.divIcon({ className: '', iconSize: [44, 56], iconAnchor: [22, 50], html:
  `<div style="display:flex;flex-direction:column;align-items:center"><div style="width:40px;height:40px;border-radius:50%;background:${c.color}40;border:2px solid ${c.color};display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 0 18px ${c.color}cc">${c.emoji}</div><div style="margin-top:2px;font-size:10px;font-weight:900;color:#fff;background:rgba(0,0,0,.6);padding:1px 6px;border-radius:8px">${c.name}</div></div>` });

const zoneIcon = () => L.divIcon({ className: '', iconSize: [24, 24], iconAnchor: [12, 24], html:
  `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#06b6d4;border:2px solid #fff;box-shadow:0 0 12px rgba(6,182,212,.7)"></div>` });

// Live high-accuracy geolocation.
const Locator = ({ onFix, registerLocate }) => {
  const map = useMap();
  useEffect(() => {
    if (!navigator.geolocation) return;
    let first = true;
    const fix = (pos) => {
      const c = [pos.coords.latitude, pos.coords.longitude];
      onFix(c, pos.coords.accuracy);
      if (first) { map.flyTo(c, 17, { duration: 1.2 }); first = false; }
    };
    const wid = navigator.geolocation.watchPosition(fix, () => {}, { enableHighAccuracy: true, maximumAge: 3000, timeout: 12000 });
    registerLocate(() => navigator.geolocation.getCurrentPosition((p) => { const c = [p.coords.latitude, p.coords.longitude]; onFix(c, p.coords.accuracy); map.flyTo(c, 17, { duration: 1 }); }, () => {}, { enableHighAccuracy: true }));
    return () => navigator.geolocation.clearWatch(wid);
  }, []); // eslint-disable-line
  return null;
};

// Exposes a flyTo() so external buttons can move the map.
const MapCtrl = ({ goRef, onMap }) => {
  const map = useMap();
  useEffect(() => { goRef.current = (ll, z = 16) => map.flyTo(ll, z, { duration: 1 }); if (onMap) onMap(goRef.current); }, []); // eslint-disable-line
  return null;
};

const RadarMap = ({ child, childCoord, zones = [], height = 360, onFix, onMap }) => {
  const [view, setView] = useState('Dark');
  const [parent, setParent] = useState(DEFAULT);
  const [acc, setAcc] = useState(0);
  const [located, setLocated] = useState(false);
  const locateRef = useRef(null);
  const goRef = useRef(null);
  const childPos = childCoord || [parent[0] + 0.0026, parent[1] + 0.0034];

  const handleFix = (c, accuracy) => { setParent(c); setAcc(accuracy || 0); setLocated(true); if (onFix) onFix({ parent: [c[1], c[0]], child: [c[1] + 0.0034, c[0] + 0.0026] }); };

  return (
    <div className="relative w-full rounded-[22px] overflow-hidden border border-white/[0.08]" style={{ height }}>
      <MapContainer center={DEFAULT} zoom={15} maxZoom={21} style={{ height: '100%', width: '100%', background: '#05070d' }} zoomControl={false} attributionControl={false}>
        {VIEWS[view].layers.map((l, i) => (
          <TileLayer key={view + i} url={l.url} subdomains={l.sub ? l.sub.split('') : ['a', 'b', 'c']} maxZoom={21} maxNativeZoom={l.maxNative} />
        ))}
        {acc > 0 && acc < 500 && <Circle center={parent} radius={acc} pathOptions={{ color: '#6366f1', weight: 1, fillColor: '#6366f1', fillOpacity: 0.1 }} />}
        <Marker position={parent} icon={pIcon()} />
        <Marker position={childPos} icon={cIcon(child)} />
        <Circle center={childPos} radius={220} pathOptions={{ color: child.safeZone.inside ? '#10b981' : '#f59e0b', weight: 1.5, fillOpacity: 0.06 }} />
        {zones.map((z) => (
          <React.Fragment key={z.id}>
            <Circle center={[z.lat, z.lng]} radius={z.radius || 100} pathOptions={{ color: '#06b6d4', weight: 1.5, fillColor: '#06b6d4', fillOpacity: 0.1 }} />
            <Marker position={[z.lat, z.lng]} icon={zoneIcon()} />
          </React.Fragment>
        ))}
        <Locator onFix={handleFix} registerLocate={(fn) => (locateRef.current = fn)} />
        <MapCtrl goRef={goRef} onMap={onMap} />
      </MapContainer>

      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5 bg-black/55 backdrop-blur-md rounded-2xl p-1.5 border border-white/10">
        {Object.entries(VIEWS).map(([k, v]) => (
          <button key={k} onClick={() => setView(k)} className={`ag-tap w-9 h-9 rounded-xl flex items-center justify-center ${view === k ? 'bg-cyan-500/30' : ''}`} title={v.label}>
            <v.icon size={16} className={view === k ? 'text-cyan-300' : 'text-slate-300'} />
          </button>
        ))}
      </div>
      {/* Jump-to-person buttons */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <button onClick={() => goRef.current && goRef.current(parent, 17)} className="ag-tap flex items-center gap-2 pl-2 pr-3 h-9 rounded-full bg-black/55 backdrop-blur-md border border-white/10">
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-black">J</span>
          <span className="text-white text-[12px] font-bold">You</span>
        </button>
        <button onClick={() => goRef.current && goRef.current(childPos, 17)} className="ag-tap flex items-center gap-2 pl-2 pr-3 h-9 rounded-full bg-black/55 backdrop-blur-md border border-white/10">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[13px]" style={{ background: `${child.color}40`, border: `1px solid ${child.color}` }}>{child.emoji}</span>
          <span className="text-white text-[12px] font-bold">{child.name}</span>
        </button>
      </div>
      {located && acc > 0 && <div className="absolute bottom-3 left-3 z-[1000] text-[10px] font-bold text-white/80 bg-black/50 px-2 py-1 rounded-lg">Accuracy ±{Math.round(acc)}m</div>}
      {!located && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-center gap-2.5 bg-black/70 backdrop-blur-md border border-cyan-400/30 rounded-2xl p-2.5">
          <LocateFixed size={18} className="text-cyan-300 flex-shrink-0" />
          <span className="flex-1 text-[12px] font-semibold text-white leading-tight">Location is off — turn it on to see where you are</span>
          <button onClick={() => locateRef.current && locateRef.current()} className="ag-tap px-3.5 h-8 rounded-full bg-cyan-500 text-[#031018] font-black text-[12px]">Enable</button>
        </div>
      )}
    </div>
  );
};

export default RadarMap;
