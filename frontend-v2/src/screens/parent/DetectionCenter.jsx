import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ShieldCheck, ShieldAlert, Wifi, MapPin, Navigation, Globe, AlertTriangle, Smartphone,
} from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { useRealtime } from '../../context/RealtimeContext';

const Page = ({ title, sub, children }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>
        <div className="flex-1 min-w-0"><h1 className="text-[22px] font-black text-white tracking-tight leading-tight">{title}</h1>{sub && <p className="text-slate-500 text-[13px] font-semibold mt-0.5">{sub}</p>}</div>
      </div>
      {children}
    </div>
  );
};
const Card = ({ children, className = '' }) => <div className={`rounded-[22px] border border-white/[0.07] bg-[#0b0c14] ${className}`}>{children}</div>;
const Label = ({ children }) => <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em] px-1">{children}</p>;
const Toggle = ({ on, onClick }) => <button onClick={onClick} className={`ag-tap w-12 h-7 rounded-full flex items-center px-0.5 ${on ? 'bg-cyan-500/80 justify-end' : 'bg-white/10 justify-start'}`}><span className="w-6 h-6 rounded-full bg-white" /></button>;

const RISK = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
// Seeded detections — on a real child device these come from Android VPNService /
// mock-location APIs and proxy inspection, raised as Security Alerts.
const DETECTIONS = [
  { id: 1, app: 'Turbo VPN', type: 'VPN', icon: Wifi, time: '2h ago', device: 'Pixel 7', risk: 'High' },
  { id: 2, app: 'Fake GPS Location', type: 'Mock Location', icon: MapPin, time: 'Yesterday', device: 'Pixel 7', risk: 'High' },
  { id: 3, app: 'Proxy Master', type: 'Proxy', icon: Globe, time: '3 days ago', device: 'Galaxy S22', risk: 'Medium' },
];

const ICON_FOR = { vpn: Wifi, proxy: Globe, dns: Globe, mock_location: MapPin, location_jump: Navigation, app_access_request: ShieldAlert, app_uninstall: ShieldAlert };
const iconForKind = (kind = '') => ICON_FOR[kind] || (kind.startsWith('tamper') ? ShieldAlert : Wifi);

const DetectionCenter = () => {
  const { child } = useChild();
  const { liveDetections } = useRealtime();
  const [det, setDet] = useState(() => { try { return { vpn: true, proxy: true, mock: true, spoof: true, ...JSON.parse(localStorage.getItem('ag_detection') || '{}') }; } catch { return { vpn: true, proxy: true, mock: true, spoof: true }; } });
  const toggle = (k) => setDet((p) => { const n = { ...p, [k]: !p[k] }; localStorage.setItem('ag_detection', JSON.stringify(n)); return n; });
  // Live detections reported by the on-device agent, newest first, then the log.
  const all = [...(liveDetections || []).map((d) => ({ ...d, icon: iconForKind(d.kind) })), ...DETECTIONS];

  const MONITORS = [
    { k: 'vpn', icon: Wifi, label: 'VPN Detection', sub: 'Flags VPN apps & tunnels' },
    { k: 'proxy', icon: Globe, label: 'Proxy Detection', sub: 'Flags HTTP / SOCKS proxies' },
    { k: 'mock', icon: MapPin, label: 'Mock Location', sub: 'Detects fake-GPS apps' },
    { k: 'spoof', icon: Navigation, label: 'GPS Spoofing', sub: 'Detects location spoofing' },
  ];
  const active = MONITORS.filter((m) => det[m.k]).length;

  return (
    <Page title="VPN & Spoofing Detection" sub={`${child.name} · ${active}/4 monitors active`}>
      <Card className={`flex items-center gap-3.5 p-4 ${all.length ? 'border-amber-500/25 bg-amber-500/[0.05]' : ''}`}>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${all.length ? 'bg-amber-500/15' : 'bg-emerald-500/15'}`}>{all.length ? <ShieldAlert size={20} className="text-amber-400" /> : <ShieldCheck size={20} className="text-emerald-400" />}</div>
        <div className="flex-1"><p className="text-white font-black text-[15px]">{all.length} detection{all.length === 1 ? '' : 's'} on record</p><p className="text-slate-500 text-[12.5px] font-semibold">Children may try to bypass monitoring with these tools.</p></div>
      </Card>

      <Label>Detection Monitors</Label>
      <Card className="divide-y divide-white/[0.05]">
        {MONITORS.map((m) => (
          <div key={m.k} className="flex items-center gap-3.5 p-4"><div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0"><m.icon size={17} className="text-cyan-400" /></div><div className="flex-1 min-w-0"><p className="text-white font-bold text-[14px]">{m.label}</p><p className="text-slate-500 text-[12px] font-semibold truncate">{m.sub}</p></div><Toggle on={det[m.k]} onClick={() => toggle(m.k)} /></div>
        ))}
      </Card>

      <Label>Recent Detections</Label>
      <Card className="divide-y divide-white/[0.05]">
        {all.map((d) => (
          <div key={d.id} className="flex items-center gap-3.5 p-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${RISK[d.risk]}1f` }}><d.icon size={18} style={{ color: RISK[d.risk] }} /></div>
            <div className="flex-1 min-w-0"><p className="text-white font-bold text-[14px] truncate">{d.app}</p><p className="text-slate-500 text-[12px] font-semibold truncate flex items-center gap-1"><Smartphone size={11} /> {d.device} · {d.time}</p></div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0"><span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: `${RISK[d.risk]}1f`, color: RISK[d.risk] }}>{d.risk.toUpperCase()}</span><span className="text-slate-600 text-[10.5px] font-bold">{d.type}</span></div>
          </div>
        ))}
      </Card>

      <Card className="flex items-start gap-2.5 p-4 border-cyan-500/15 bg-cyan-500/[0.05]"><ShieldCheck size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" /><p className="text-[12px] text-slate-400 leading-relaxed font-medium">On the child device, detection runs continuously via Android VPNService inspection and the mock-location API. Any new detection raises a Security Alert and is logged here.</p></Card>
    </Page>
  );
};

export default DetectionCenter;
