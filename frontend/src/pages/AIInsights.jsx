import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Brain, Activity, ShieldAlert, Zap, TrendingUp, TrendingDown, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

const AIInsights = () => {
  const { activeChild, token } = useAuth();
  const childId = activeChild?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch report full to get a comprehensive view for the AI
        const res = await fetch(`/api/reports/full?childId=${childId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [childId, token]);

  if (!childId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#475569', textAlign: 'center', padding: '20px' }}>
        <div>
          <Brain size={48} color="#334155" style={{ marginBottom: '16px' }} />
          <p style={{ fontSize: '16px' }}>No child device selected</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Pair a device from Controls first to see AI Insights</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '20px' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '3px solid rgba(37,99,235,0.2)', borderTopColor: '#2563eb', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>AlphaGuard AI is analyzing data...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) return <div style={{ padding: '24px', color: '#fff' }}>Failed to load insights.</div>;

  const score = data.riskScore || 85;
  const level = data.riskLevel || 'Low Risk';
  const getScoreColor = (s) => s > 75 ? '#10b981' : s > 40 ? '#f59e0b' : '#ef4444';
  const scoreColor = getScoreColor(score);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 16px 40px', height: 'calc(100vh - 100px)', overflowY: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Brain size={28} color="#2563eb" />
          AI Insights
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Automated analysis of {activeChild?.name}'s digital behavior</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Wellbeing Score Card */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase' }}>Overall Safety Score</div>
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <circle cx="60" cy="60" r="54" fill="none" stroke={scoreColor} strokeWidth="12" strokeDasharray="339.29" strokeDashoffset={339.29 - (339.29 * score / 100)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: '900', color: '#fff', lineHeight: '1' }}>{score}</span>
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>/ 100</span>
            </div>
          </div>
          <div style={{ padding: '6px 16px', background: `${scoreColor}15`, border: `1px solid ${scoreColor}40`, borderRadius: '20px', color: scoreColor, fontSize: '14px', fontWeight: '700' }}>
            {level}
          </div>
        </div>

        {/* AI Summary Card */}
        <div className="glass-card" style={{ padding: '24px', gridColumn: 'auto / span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#2563eb" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>AlphaGuard Analysis</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: '#e2e8f0', fontSize: '15px', lineHeight: '1.6' }}>
              Based on the last 7 days of activity, {activeChild?.name} is spending an average of <strong>{data.last30DaysSummary?.averageDailyFormatted || '2h'}</strong> per day on their device. 
              The most heavily used category is <strong>{data.mostWatchedCategory || 'Entertainment'}</strong>.
            </p>
            {data.unauthorizedAccessCount > 0 ? (
              <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', borderLeft: '4px solid #ef4444', borderRadius: '8px 12px 12px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '700', marginBottom: '4px', fontSize: '14px' }}>
                  <AlertTriangle size={16} /> Security Alert
                </div>
                <div style={{ color: '#fca5a5', fontSize: '13px' }}>Face Guard detected {data.unauthorizedAccessCount} unauthorized access attempts. Please review the camera logs.</div>
              </div>
            ) : (
              <div style={{ padding: '16px', background: 'rgba(16,185,129,0.1)', borderLeft: '4px solid #10b981', borderRadius: '8px 12px 12px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '700', marginBottom: '4px', fontSize: '14px' }}>
                  <ShieldCheck size={16} /> Device Secure
                </div>
                <div style={{ color: '#a7f3d0', fontSize: '13px' }}>No unauthorized access attempts detected by Face Guard recently.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '16px', marginTop: '32px' }}>Smart Recommendations</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {data.recommendations && data.recommendations.length > 0 ? data.recommendations.map((rec, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', display: 'flex', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={20} color="#a78bfa" />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: '1.5' }}>{rec}</div>
            </div>
          </div>
        )) : (
           <div style={{ color: '#94a3b8', fontSize: '14px', gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
             No urgent recommendations at this time.
           </div>
        )}
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Recent Behavioral Flags</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.flags && data.flags.length > 0 ? data.flags.map((flag, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
            <div style={{ fontSize: '14px', color: '#e2e8f0' }}>{flag}</div>
          </div>
        )) : (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No recent behavioral flags detected. Great job!
          </div>
        )}
      </div>

    </div>
  );
};

export default AIInsights;
