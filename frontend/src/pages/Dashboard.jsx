import React from 'react';
import { Clock, Smartphone, User, Wifi, WifiOff } from 'lucide-react';
import { useLivePolling } from '../hooks/useLivePolling';
import { useAuth } from '../context/AuthContext';
import { Brain, Heart, Moon, Activity } from 'lucide-react';

const useFetch = (path, childId) => {
  const [data, ReactSetData] = React.useState(null);
  const { token } = useAuth();
  React.useEffect(() => {
    if (!childId || !token) return;
    fetch(`/api${path}?childId=${childId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) ReactSetData(d.data); }).catch(() => {});
  }, [path, childId, token]);
  return data;
};

const Dashboard = () => {
  const { activeChild } = useAuth();
  const data = useLivePolling('/api/dashboard');

  if (!activeChild) {
    return (
      <div className="glass-card" style={{ padding: '40px 24px', textAlign: 'center', marginTop: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>Welcome to AlphaGuard AI</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>Please connect a child device to begin monitoring.</p>
      </div>
    );
  }

  if (!data) return <div style={{ padding: '24px', color: '#fff' }}>Loading Data...</div>;

  const sendReaction = async (type, emoji, text) => {
    try {
      await fetch(`/api/device/send-reaction/${activeChild.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alphaguard_token')}` },
        body: JSON.stringify({ type, emoji, text })
      });
      // maybe show a toast
    } catch (e) {}
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      
      {/* Device Connection Status */}
      <div className="glass-card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <User size={20} color={data.isPaired ? "var(--accent-cyan)" : "var(--text-muted)"} />
          <span style={{ fontSize: '16px', color: '#fff', fontWeight: '600' }}>
            {data.isPaired ? `Child device (${data.childName}) paired to ${data.parentName}` : "No child device connected"}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {data.isPaired ? (
            <><Wifi size={16} color="var(--accent-green)" /><span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '12px' }}>CONNECTED</span></>
          ) : (
            <><WifiOff size={16} color="var(--text-muted)" /><span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '12px' }}>UNLINKED</span></>
          )}
        </div>
      </div>

      {!data.isPaired ? (
        <div className="glass-card flex-center" style={{ padding: '60px 24px', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', color: '#fff' }}>No Active Connection</h2>
          <p style={{ color: 'var(--text-muted)' }}>Generate a QR code from the Controls tab to pair your child's phone.</p>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px' }}>Dashboard</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-muted)' }}>
                <Clock size={18} /> <span style={{ fontWeight: 'bold' }}>Total Screen Time Today</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-cyan)' }}>{data.todayScreenTime}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Top Apps List */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} color="var(--accent-primary)" /> App Usage List
              </h3>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.topApps && data.topApps.length > 0 ? data.topApps.map((app, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{app.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{app.time}</span>
                  </li>
                )) : <li style={{ color: 'var(--text-muted)' }}>No app usage data found today.</li>}
              </ul>
            </div>

            {/* AI Insights Summary Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={24} color="var(--accent-primary)" />
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold' }}>BEHAVIOR SCORE</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>85<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/100</span></div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={24} color="var(--accent-green)" />
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold' }}>WEEKLY TREND</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent-green)' }}>-12% Screen Time</div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Moon size={24} color="var(--accent-red)" />
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold' }}>LATE NIGHT USAGE</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>2 Sessions Past 10PM</div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={24} color="var(--accent-yellow)" />
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold' }}>MOOD SUMMARY</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Mostly Happy 😄</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Reactions */}
          <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>❤️</span> Quick Reactions
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>Send a real-time message to {activeChild.name}'s screen.</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { type: 'love', emoji: '❤️', text: 'Love you!' },
                { type: 'proud', emoji: '🌟', text: 'So proud of you!' },
                { type: 'thumbsUp', emoji: '👍', text: 'Great job!' },
                { type: 'time', emoji: '⏰', text: 'Time to wrap up!' },
                { type: 'dinner', emoji: '🍽️', text: 'Dinner is ready!' }
              ].map(reaction => (
                <button
                  key={reaction.type}
                  onClick={() => sendReaction(reaction.type, reaction.emoji, reaction.text)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 20px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
                    color: '#fff', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <span style={{ fontSize: '18px' }}>{reaction.emoji}</span> {reaction.text}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
