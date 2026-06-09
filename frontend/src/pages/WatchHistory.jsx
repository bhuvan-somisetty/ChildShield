import React, { useState } from 'react';
import { PlayCircle, AlertCircle, Clock, Search, Gamepad2, ChevronDown, ChevronUp } from 'lucide-react';
import { useLivePolling } from '../hooks/useLivePolling';
import { Card } from '../components/ui';

const RISK = { high: '#f43f5e', medium: '#f59e0b', low: '#06b6d4' };

const WatchHistory = () => {
  const history = useLivePolling('/api/history') || [];
  const [expandedGroups, setExpandedGroups] = useState({ Today: true, Yesterday: false });

  const getRiskColor = (risk) => RISK[risk] || RISK.low;
  const getIcon = (category, color) => {
    const p = { size: 22, color };
    if (category === 'Gaming') return <Gamepad2 {...p} />;
    if (category === 'Search') return <Search {...p} />;
    return <PlayCircle {...p} />;
  };
  const toggleGroup = (g) => setExpandedGroups((p) => ({ ...p, [g]: !p[g] }));

  const groupedHistory = {
    Today: history,
    Yesterday: [
      { id: 'y1', app: 'Netflix', title: 'Stranger Things S4E1', category: 'Entertainment', startTime: '8:00 PM', duration: '1h 15m', risk: 'low', alerts: [] },
      { id: 'y2', app: 'Google', title: 'Search: How to bypass safe search', category: 'Search', startTime: '4:30 PM', duration: '5m', risk: 'high', alerts: ['Restricted Search Attempt'] },
    ],
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-[640px] mx-auto ag-rise">
      <div className="px-1">
        <h1 className="text-[20px] font-black text-white tracking-tight leading-none">Activity Feed</h1>
        <p className="text-[12px] text-slate-500 font-semibold mt-1.5">Live timeline of app & content activity</p>
      </div>

      <div className="flex flex-col gap-4">
        {Object.entries(groupedHistory).map(([groupName, items]) => (
          <Card key={groupName} padded={false} className="overflow-hidden">
            <button onClick={() => toggleGroup(groupName)} className="ag-tap w-full flex items-center justify-between px-4 py-4">
              <h3 className={`text-[14px] font-black ${groupName === 'Today' ? 'text-cyan-400' : 'text-slate-300'}`}>{groupName}</h3>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-bold text-slate-400 bg-white/[0.06] px-2.5 py-1 rounded-full">{items.length} events</span>
                {expandedGroups[groupName] ? <ChevronUp size={17} className="text-slate-400" /> : <ChevronDown size={17} className="text-slate-400" />}
              </div>
            </button>

            {expandedGroups[groupName] && (
              <div className="flex flex-col gap-2.5 px-3 pb-3">
                {items.length === 0 ? (
                  <div className="py-5 text-center text-[12.5px] text-slate-500">No activity logged.</div>
                ) : items.map((entry, index) => {
                  const color = getRiskColor(entry.risk);
                  const isLatest = index === 0 && groupName === 'Today';
                  return (
                    <div key={entry.id} className="flex gap-3.5 p-3.5 rounded-2xl border-l-[3px] bg-white/[0.02]"
                      style={{ borderLeftColor: color, background: isLatest ? 'rgba(6,182,212,0.05)' : 'rgba(255,255,255,0.02)' }}>
                      <div className="relative mt-0.5 flex-shrink-0">
                        {getIcon(entry.category, color)}
                        {isLatest && <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-bold text-white leading-snug mb-1">{entry.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-500 mb-1.5">
                          <span className="font-semibold text-slate-400">{entry.app}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {entry.startTime} ({entry.duration})</span>
                        </div>
                        {entry.alerts && entry.alerts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {entry.alerts.map((alert, i) => (
                              <span key={i} className="flex items-center gap-1 bg-rose-500/15 text-rose-400 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                                <AlertCircle size={12} /> {alert}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WatchHistory;
