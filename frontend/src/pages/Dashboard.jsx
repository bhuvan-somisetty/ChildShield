import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, TrendingUp, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useLivePolling } from '../hooks/useLivePolling';

const Dashboard = () => {
  const data = useLivePolling('/api/dashboard');

  if (!data) return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
      <div className="skeleton" style={{ gridColumn: 'span 12', height: '120px' }}></div>
      <div className="skeleton" style={{ gridColumn: 'span 8', height: '400px' }}></div>
      <div className="skeleton" style={{ gridColumn: 'span 4', height: '400px' }}></div>
    </div>
  );

  const topApp = data.topApps.length > 0 ? data.topApps[0] : null;
  const TopAppIcon = topApp && Icons[topApp.icon] ? Icons[topApp.icon] : Icons.Smartphone;

  return (
    <div className="animate-fade-in">
      
      {/* Dynamic Header & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>Platform Overview</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 'bold' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'pulse 1.5s infinite' }}></div>
            LIVE TELEMETRY SYNC ACTIVE
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
        
        {/* Screen Time Box */}
        <div className="glass-card animate-slide-up" style={{ padding: '24px', animationDelay: '0.05s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Time</span>
            <Clock size={20} color="var(--accent-cyan)" />
          </div>
          <div className="text-glow-cyan" style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', lineHeight: 1 }}>{data.todayScreenTime}</div>
          <div style={{ fontSize: '13px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={14} /> Below daily limit of {data.limit}
          </div>
        </div>

        {/* Global Security Box */}
        <div className="glass-card animate-slide-up" style={{ padding: '24px', animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security System</span>
            <ShieldCheck size={20} color="var(--accent-green)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', lineHeight: 1 }}>
            Secured
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Safe Browsing Enforced</div>
        </div>
        
        {/* Alerts Box */}
        <div className="glass-card animate-slide-up" style={{ padding: '24px', animationDelay: '0.15s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Alerts</span>
            <AlertTriangle size={20} color={data.liveFeed.length > 5 ? "var(--accent-red)" : "var(--accent-yellow)"} />
          </div>
          <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', lineHeight: 1, color: data.liveFeed.length > 5 ? 'var(--accent-red)' : '#fff' }}>0</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No critical flags in past 24h</div>
        </div>

        {/* Top App Box */}
        <div className="glass-card animate-slide-up" style={{ padding: '24px', animationDelay: '0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
             <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Used App</span>
             {topApp && <TopAppIcon size={20} color={topApp.color} />}
          </div>
          {topApp && (
            <>
              <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', lineHeight: 1 }}>{topApp.name}</div>
              <div style={{ fontSize: '14px', color: topApp.color, fontWeight: '600' }}>{topApp.time} Usage</div>
            </>
          )}
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        
        {/* Trend Chart Area */}
        <div className="glass-card animate-slide-up" style={{ gridColumn: 'span 8', padding: '24px', animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px' }}>Watch Time Trend (Weekly)</h3>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="time" stroke="var(--accent-cyan)" strokeWidth={3} fillOpacity={1} fill="url(#colorTime)" animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Activity Stream Mobile Module */}
        <div className="glass-card animate-slide-up" style={{ gridColumn: 'span 4', padding: '24px', animationDelay: '0.3s' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--accent-purple)" /> Real-Time Feed
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.liveFeed && data.liveFeed.length > 0 ? data.liveFeed.slice(0, 5).map((feed, i) => (
              <div key={feed.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: '12px',
                background: i === 0 ? 'rgba(176, 38, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                borderLeft: i === 0 ? '4px solid var(--accent-purple)' : '4px solid transparent',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: i === 0 ? '#fff' : 'var(--text-secondary)' }}>
                    {feed.app}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {feed.message}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(feed.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )) : <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Waiting for updates...</div>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
