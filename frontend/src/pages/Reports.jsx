import React from 'react';
import { Download, FileText, CheckCircle, AlertTriangle, ShieldX, Activity } from 'lucide-react';
import { useLivePolling } from '../hooks/useLivePolling';

const Reports = () => {
  const insights = useLivePolling('/api/insights');

  if(!insights) return <div className="animate-fade-in" style={{ padding: '24px' }}>Loading live reports...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Dynamic Risk Assessment</h2>
          <p style={{ color: 'var(--text-muted)' }}>AI-driven live evaluation of current activity patterns.</p>
        </div>
        <button style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', color: '#fff', cursor: 'pointer'
        }}>
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
          
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="120" height="120" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', transition: 'all 1s' }}>
              <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <circle cx="70" cy="70" r="60" fill="none" stroke={insights.score > 70 ? "var(--accent-green)" : insights.score > 40 ? "#f59e0b" : "var(--accent-red)"} strokeWidth="12" 
                strokeDasharray="377" 
                strokeDashoffset={377 - (377 * insights.score) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s' }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff' }}>{insights.score}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/ 100</div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {insights.level === 'Low Risk' ? <CheckCircle color="var(--accent-green)"/> : 
               insights.level === 'Medium Risk' ? <AlertTriangle color="#f59e0b"/> : 
               <ShieldX color="var(--accent-red)"/> }
              {insights.level}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, maxWidth: '500px', margin: '0 auto' }}>
              The current risk score is dynamically shifting based on real-time activity tracking, 
              facial presence verification patterns, and categorized watch histories.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Reports;
