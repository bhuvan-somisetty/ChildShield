import React, { useState } from 'react';
import { PlayCircle, AlertCircle, Clock, Search, Gamepad2, ChevronDown, ChevronUp } from 'lucide-react';
import { useLivePolling } from '../hooks/useLivePolling';

const WatchHistory = () => {
  const history = useLivePolling('/api/history') || [];
  const [expandedGroups, setExpandedGroups] = useState({ 'Today': true, 'Yesterday': false });

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'high': return 'var(--accent-red)';
      case 'medium': return 'var(--accent-yellow)';
      default: return 'var(--accent-cyan)';
    }
  };

  const getIcon = (category) => {
    if(category === 'Gaming') return <Gamepad2 size={24} />;
    if(category === 'Search') return <Search size={24} />;
    return <PlayCircle size={24} />;
  };

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Live Simulation grouping mock
  const groupedHistory = {
    'Today': history,
    'Yesterday': [
      { id: 'y1', app: 'Netflix', title: 'Stranger Things S4E1', category: 'Entertainment', startTime: '8:00 PM', duration: '1h 15m', risk: 'low', alerts: [] },
      { id: 'y2', app: 'Google', title: 'Search: How to bypass safe search', category: 'Search', startTime: '4:30 PM', duration: '5m', risk: 'high', alerts: ['Restricted Search Attempt'] }
    ]
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 className="section-title">Activity Feed</h2>
        <p className="section-sub">Live timeline of device application and content requests.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Object.entries(groupedHistory).map(([groupName, items]) => (
          <div key={groupName} className="glass-card" style={{ padding: '4px 0', borderTop: groupName==='Today' ? '2px solid var(--accent-purple)' : '1px solid rgba(255,255,255,0.05)' }}>
            
            <div 
              onClick={() => toggleGroup(groupName)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', cursor: 'pointer' }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: groupName === 'Today' ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>{groupName}</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>{items.length} events</span>
                {expandedGroups[groupName] ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
              </div>
            </div>

            {expandedGroups[groupName] && (
              <div style={{ display: 'flex', flexDirection: 'column', padding: '0 12px 12px' }}>
                {items.length === 0 ? <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>No activity logged.</div> : items.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className="animate-fade-in"
                    style={{ 
                      display: 'flex', padding: '16px', margin: '6px 0', borderRadius: '12px',
                      background: index === 0 && groupName === 'Today' ? 'rgba(0, 229, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      borderLeft: `3px solid ${getRiskColor(entry.risk)}`,
                      transition: 'background 0.3s'
                    }}
                  >
                    <div style={{ display: 'flex', width: '100%', gap: '16px' }}>
                      <div style={{ position: 'relative', marginTop: '2px' }}>
                         {React.cloneElement(getIcon(entry.category), { color: getRiskColor(entry.risk) })}
                         {index === 0 && groupName === 'Today' && <div style={{ position: 'absolute', top: -2, right: -4, width: 8, height: 8, background: 'var(--accent-cyan)', borderRadius: '50%', animation: 'pulse 1s infinite' }}/>}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: index === 0 && groupName === 'Today' ? '#fff' : 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>{entry.title}</h4>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', alignItems: 'center' }}>
                          <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>{entry.app}</span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {entry.startTime} ({entry.duration})</span>
                        </div>

                        {entry.alerts && entry.alerts.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {entry.alerts.map((alert, i) => (
                              <div key={i} style={{ 
                                display: 'flex', alignItems: 'center', gap: '4px', 
                                background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', 
                                padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600'
                              }}>
                                <AlertCircle size={12} /> {alert}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchHistory;
