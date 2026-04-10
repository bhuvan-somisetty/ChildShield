import React from 'react';
import { useLivePolling } from '../hooks/useLivePolling';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Analytics = () => {
  const { activeChild } = useAuth();
  const data = useLivePolling('/api/dashboard');

  if (!activeChild || !activeChild.isPaired) {
    return (
      <div className="animate-fade-in" style={{ padding: '60px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <ShieldAlert size={64} color="var(--accent-purple)" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Device Not Connected</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Analytics are currently unavailable. Please link a child device to start receiving real-time usage metrics and insights.</p>
      </div>
    );
  }

  if (!data) return <div style={{ padding: '24px', color: '#fff', textAlign: 'center' }}>Synchronizing telemetry data...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Simplified Analytics</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Live statistical breakdown.</p>

      <div className="responsive-grid">
        <div className="glass-card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <BarChart2 size={20} color="var(--accent-cyan)" /> Application Category Focus (Minutes)
          </h3>
          
          {data.categoryDistribution && data.categoryDistribution.length > 0 ? (
            <div style={{ width: '100%', height: '350px', marginLeft: '-20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                    contentStyle={{ backgroundColor: 'rgba(15,15,23,0.9)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {data.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || 'var(--accent-cyan)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No category usage data compiled yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
