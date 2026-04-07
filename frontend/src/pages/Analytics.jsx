import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Lightbulb, Info, RefreshCw } from 'lucide-react';
import { useLivePolling } from '../hooks/useLivePolling';

const Analytics = () => {
  const data = useLivePolling('/api/dashboard');

  if(!data) return <div className="animate-fade-in" style={{ padding: '24px' }}>Loading analytics...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Live Behavioral Analytics</h2>
          <p style={{ color: 'var(--text-muted)' }}>Real-time streaming distribution of screen time habits.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div className="glass-card animate-fade-in" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Active Content Heatmap</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dynamically shifting based on current telemetry.</p>
          <div style={{ width: '100%', height: '250px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.heatmap} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="time" stroke="var(--text-muted)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(30,30,50,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} 
                />
                <Bar dataKey="Entertainment" stackId="a" fill="var(--accent-purple)" animationDuration={1000} />
                <Bar dataKey="Gaming" stackId="a" fill="var(--accent-cyan)" animationDuration={1000} />
                <Bar dataKey="Education" stackId="a" fill="var(--accent-green)" animationDuration={1000} />
                <Bar dataKey="Social" stackId="a" fill="var(--accent-red)" animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card animate-fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Category Focus</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Live aggregated distribution.</p>
          <div style={{ width: '100%', minHeight: '220px', marginTop: '16px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={220}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={data.categoryDistribution}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4}
                  dataKey="value" stroke="none" animationDuration={1000}
                >
                  {data.categoryDistribution.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
            {data.categoryDistribution.map((entry) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color, marginRight: '6px' }} />
                <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
