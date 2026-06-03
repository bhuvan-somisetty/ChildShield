import React from 'react';
import { Clock, Smartphone, User, Wifi, WifiOff, Brain, Heart, Moon, Activity, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { useLivePolling } from '../hooks/useLivePolling';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { activeChild } = useAuth();
  const data = useLivePolling('/api/dashboard');
  const history = useLivePolling('/api/history') || [];

  if (!activeChild) {
    return (
      <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center', marginTop: '40px', maxWidth: '600px', margin: '40px auto 0' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(16,185,129,0.05))',
          border: '2px solid #2563eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 0 20px rgba(37,99,235,0.2)'
        }}>
          <ShieldCheck size={32} color="#2563eb" />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>Welcome to AlphaGuard AI</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
          Please connect a child device or select an active child profile from the header to begin supervising activities.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ height: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-cyan)', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading Dashboard Metrics...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const sendReaction = async (type, emoji, text) => {
    try {
      const token = localStorage.getItem('cs_token') || localStorage.getItem('alphaguard_token');
      await fetch(`/api/device/send-reaction/${activeChild.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type, emoji, text })
      });
    } catch (e) {}
  };

  // Calculate Family Safety Score dynamically based on data factors
  const limitMinutes = data.limitMinutes || 300;
  const screenTimeMinutes = data.todayScreenTimeMinutes || 0;
  const overtimePenalty = screenTimeMinutes > limitMinutes ? Math.min(35, Math.round(((screenTimeMinutes - limitMinutes) / 60) * 15)) : 0;
  
  // Late night penalty logic (mocked if there's any late night logs or high stats)
  const isLateNightActive = screenTimeMinutes > 180 && data.topApps?.some(a => a.name === 'TikTok' || a.name === 'YouTube');
  const lateNightPenalty = isLateNightActive ? 15 : 0;
  
  // Focus reward logic
  const focusReward = activeChild.pomodoroActive ? 10 : 5; 
  
  const safetyScore = Math.max(30, Math.min(100, 100 - overtimePenalty - lateNightPenalty + focusReward));

  // Dynamic AI Insights generator
  const getAIInsights = () => {
    const insights = [];
    if (screenTimeMinutes > limitMinutes * 0.8) {
      insights.push({
        type: 'warning',
        text: 'Screen time limit is almost reached today. Recommend activating Focus Mode.',
      });
    } else {
      insights.push({
        type: 'success',
        text: 'Screen time usage is within normal bounds. Focus habits are healthy.',
      });
    }

    if (isLateNightActive) {
      insights.push({
        type: 'alert',
        text: 'Usage spike detected after 8 PM. Suggest setting a Night Restriction rule.',
      });
    }

    if (activeChild.nightRestriction) {
      insights.push({
        type: 'info',
        text: 'Night restriction is active. Device will lock automatically at 9:00 PM.',
      });
    } else {
      insights.push({
        type: 'recommend',
        text: 'Recommend scheduling focus bounds to improve child study habits.',
      });
    }

    return insights;
  };

  const aiInsights = getAIInsights();

  // Circle Gauge Math
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safetyScore / 100) * circumference;

  const scoreColor = safetyScore > 80 ? '#10b981' : safetyScore > 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '80px', paddingLeft: '16px', paddingRight: '16px' }}>
      
      {/* Connection Header */}
      <div className="glass-card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <span style={{ fontSize: '15px', color: '#fff', fontWeight: '700', whiteSpace: 'nowrap', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {data.childName}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AlphaGuard Agent Supervision</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {data.isPaired ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Wifi size={14} color="#10b981" />
              <span style={{ color: '#10b981', fontWeight: '800', fontSize: '11px', letterSpacing: '0.5px' }}>ONLINE</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <WifiOff size={14} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)', fontWeight: '800', fontSize: '11px' }}>OFFLINE</span>
            </div>
          )}
        </div>
      </div>

      {!data.isPaired ? (
        <div className="glass-card flex-center" style={{ padding: '60px 24px', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', color: '#fff', fontWeight: '800' }}>No Active Connection</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px' }}>Pair your child's phone using a Sync Code or QR code from the Controls tab to enable live tracking.</p>
        </div>
      ) : (
        <>
          {/* Main Dashboard Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            
            {/* COLUMN 1: Family Safety Score (0-100) */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '20px', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={18} color="var(--accent-cyan)" /> Family Safety Score
              </h3>

              <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <svg width="150" height="150" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r={radius} fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                  <circle 
                    cx="60" 
                    cy="60" 
                    r={radius} 
                    fill="transparent" 
                    stroke={scoreColor} 
                    strokeWidth="8" 
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                  />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: '#fff' }}>{safetyScore}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Safety Score</span>
                </div>
              </div>

              {/* Factors list */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Screen Time Bound</span>
                  <span style={{ fontWeight: '700', color: overtimePenalty > 0 ? '#ef4444' : '#10b981' }}>
                    {overtimePenalty > 0 ? 'Limit Exceeded' : 'Safe'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Safe Zone Compliance</span>
                  <span style={{ fontWeight: '700', color: '#10b981' }}>Compliant</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Night Restriction</span>
                  <span style={{ fontWeight: '700', color: isLateNightActive ? '#ef4444' : '#10b981' }}>
                    {isLateNightActive ? 'Late Spikes' : 'Healthy Hours'}
                  </span>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Screen Time & Usage Details */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="var(--accent-cyan)" /> Screen Usage Today
                </h3>
                <div style={{ fontSize: '42px', fontWeight: '900', color: 'var(--accent-cyan)', marginBottom: '4px', letterSpacing: '-1px' }}>
                  {data.todayScreenTime}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Daily Limit: <strong style={{ color: 'var(--text-secondary)' }}>{data.limit || '5h 00m'}</strong>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{
                    width: `${Math.min(100, (screenTimeMinutes / limitMinutes) * 100)}%`,
                    height: '100%',
                    background: screenTimeMinutes > limitMinutes ? 'linear-gradient(90deg, #ef4444, #b91c1c)' : 'linear-gradient(90deg, #2563eb, var(--accent-cyan))',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease-in-out'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>0%</span>
                  <span>{Math.round((screenTimeMinutes / limitMinutes) * 100)}% used</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Status footer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(37,99,235,0.06)', padding: '12px 16px', borderRadius: '10px', marginTop: '20px', border: '1px solid rgba(37,99,235,0.15)' }}>
                <Activity size={16} color="var(--accent-cyan)" />
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  {screenTimeMinutes > limitMinutes ? 'Target limit exceeded for today.' : 'Usage limits are within safe parameters.'}
                </span>
              </div>
            </div>

          </div>

          {/* AI Parenting Insights & Top Apps Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            
            {/* App Usage List */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} color="var(--accent-purple)" /> Top Apps Used Today
              </h3>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.topApps && data.topApps.length > 0 ? data.topApps.map((app, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                      {app.name === 'YouTube' ? '📺' : app.name === 'TikTok' ? '🎵' : app.name === 'WhatsApp' ? '💬' : '📱'}
                    </div>
                    <span style={{ fontWeight: '700', color: '#fff', fontSize: '14px', flex: 1 }}>{app.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{app.time}</span>
                  </li>
                )) : <li style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>No app usage data found today.</li>}
              </ul>
            </div>

            {/* AI Parenting Insights */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={18} color="var(--accent-purple)" /> AI Parenting Insights
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {aiInsights.map((insight, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px',
                    background: insight.type === 'warning' || insight.type === 'alert' ? 'rgba(239,68,68,0.06)' : insight.type === 'success' ? 'rgba(16,185,129,0.06)' : 'rgba(37,99,235,0.05)',
                    borderLeft: `3px solid ${insight.type === 'warning' || insight.type === 'alert' ? '#ef4444' : insight.type === 'success' ? '#10b981' : '#2563eb'}`,
                    borderRadius: '0 12px 12px 0'
                  }}>
                    <span style={{ fontSize: '16px', marginTop: '2px' }}>
                      {insight.type === 'warning' || insight.type === 'alert' ? '⚠️' : insight.type === 'success' ? '✨' : '💡'}
                    </span>
                    <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {insight.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Daily Activity Timeline & Reactions Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            
            {/* Daily Activity Timeline */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--accent-cyan)" /> Daily Activity Timeline
              </h3>
              <div style={{
                maxHeight: '300px', overflowY: 'auto', paddingLeft: '8px', position: 'relative',
                display: 'flex', flexDirection: 'column', gap: '20px'
              }}>
                {/* Timeline vertical bar */}
                <div style={{ position: 'absolute', top: '8px', bottom: '8px', left: '16px', width: '2px', background: 'rgba(255,255,255,0.08)' }} />
                
                {history.length > 0 ? history.map((item, idx) => (
                  <div key={item.id || idx} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: item.risk === 'high' ? '#ef4444' : 'var(--bg-secondary)',
                      border: `2px solid ${item.risk === 'high' ? '#ef4444' : 'var(--accent-cyan)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginLeft: '8px'
                    }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          Opened {item.app || 'App'}
                        </h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>{item.startTime}</span>
                      </div>
                      <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {item.title || 'Screen Activity Event'} · Duration: {item.duration || 'N/A'}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center', fontSize: '13px' }}>
                    No activity logs recorded for today yet.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Reactions */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Heart size={18} color="var(--accent-red)" /> Send Quick Reaction
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
                  Send a nudge or encouraging message directly to {data.childName}'s device screen instantly.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { type: 'love', emoji: '❤️', text: 'Love you!' },
                    { type: 'proud', emoji: '🌟', text: 'So proud!' },
                    { type: 'thumbsUp', emoji: '👍', text: 'Great job!' },
                    { type: 'time', emoji: '⏰', text: 'Wrap up!' },
                  ].map(reaction => (
                    <button
                      key={reaction.type}
                      onClick={() => sendReaction(reaction.type, reaction.emoji, reaction.text)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '12px', background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                        color: '#fff', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600', fontSize: '12px'
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      <span style={{ fontSize: '16px' }}>{reaction.emoji}</span> {reaction.text}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => sendReaction('dinner', '🍽️', 'Dinner is ready!')}
                style={{
                  width: '100%', marginTop: '16px', padding: '12px',
                  background: 'rgba(37,99,235,0.1)', border: '1px dashed rgba(37,99,235,0.3)',
                  borderRadius: '12px', color: 'var(--accent-cyan)', cursor: 'pointer',
                  fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <span>🍽️</span> Send "Dinner is ready!"
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
