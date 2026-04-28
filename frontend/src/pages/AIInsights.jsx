import React, { useState, useEffect } from 'react';
import { Brain, Shield, TrendingUp, TrendingDown, Minus, Bell, Heart, Zap, FileText, AlertTriangle, CheckCircle, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const MOOD_EMOJIS = { great: '😄', good: '🙂', okay: '😐', down: '😔', angry: '😤' };

const useFetch = (path, childId) => {
  const [data, setData] = useState(null);
  const { token } = useAuth();
  useEffect(() => {
    if (!childId || !token) return;
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_BASE}${path}?childId=${childId}`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); })
      .catch(() => {});
  }, [path, childId, token]);
  return data;
};

const InsightCard = ({ insight }) => {
  const COLORS = { warning: 'var(--accent-yellow)', alert: 'var(--accent-red)', info: 'var(--accent-cyan)', good: 'var(--accent-green)' };
  const ICONS = { warning: '⚠️', alert: '🚨', info: '💡', good: '✅' };
  const color = COLORS[insight.type] || 'var(--text-muted)';
  return (
    <div style={{
      display: 'flex', gap: '14px', padding: '16px',
      background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
      borderLeft: `3px solid ${color}`, marginBottom: '10px'
    }}>
      <span style={{ fontSize: '18px' }}>{ICONS[insight.type]}</span>
      <div>
        <div style={{ color, fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px' }}>{insight.type.toUpperCase()}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>{insight.text}</div>
      </div>
    </div>
  );
};

const AIInsights = () => {
  const { user, activeChild, token } = useAuth();
  const [tab, setTab] = useState('overview');
  const [alerts, setAlerts] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([{ role: 'ai', text: "Hello! I am the AlphaGuard AI Parenting Assistant. I can advise you on digital wellbeing and parenting tips. What do you need help with?" }]);
  const [isChatting, setIsChatting] = useState(false);
  const childId = activeChild?.id;

  const insights = useFetch('/ai/behavior-insights', childId);
  const weekly = useFetch('/ai/weekly-report', childId);
  const wellbeing = useFetch('/ai/wellbeing-score', childId);

  useEffect(() => {
    if (!childId || !token) return;
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${API_BASE}/ai/smart-alerts?childId=${childId}`, { headers: h })
      .then(r => r.json()).then(d => { if (d.success) setAlerts(d.data.alerts || []); }).catch(() => {});
    fetch(`${API_BASE}/ai/emotional-checkins?childId=${childId}`, { headers: h })
      .then(r => r.json()).then(d => { if (d.success) setCheckins(d.data.checkins || []); }).catch(() => {});
  }, [childId, token]);

  if (!activeChild) return (
    <div className="animate-fade-in" style={{ padding: '60px', textAlign: 'center' }}>
      <Brain size={56} color="var(--text-muted)" style={{ marginBottom: '20px' }} />
      <h2 style={{ marginBottom: '12px' }}>No Child Profile Selected</h2>
      <p style={{ color: 'var(--text-muted)' }}>Connect a child device to unlock AI behavior insights.</p>
    </div>
  );

  const isPremium = true; // Temporary: giving all features for free for sometime

  if (!isPremium) return (
    <div className="animate-fade-in" style={{ padding: '60px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 24px',
        background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(239,68,68,0.15))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(201,168,76,0.4)', boxShadow: '0 0 30px rgba(201,168,76,0.15)'
      }}>
        <Brain size={40} color="#c9a84c" />
      </div>
      <h2 style={{ fontSize: '28px', marginBottom: '12px', fontWeight: '800' }}>Unlock <span style={{ color: '#c9a84c' }}>AlphaGuard AI</span></h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
        Upgrade to our Premium plan to access advanced AI behavior analysis, weekly intelligent reports, smart anomaly alerts, and deep mood trend tracking.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px', textAlign: 'left' }}>
        {['Advanced AI Risk Scoring', 'Weekly AI Summaries', 'Smart Spam-Free Alerts', 'Emotional Trend Analysis'].map((feature, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} color="#c9a84c" />
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{feature}</span>
          </div>
        ))}
      </div>

      <button onClick={async () => {
        try {
          const res = await fetch(`${API_BASE}/auth/upgrade-plan`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
          const d = await res.json();
          if (d.success) window.location.reload();
        } catch (e) {}
      }} style={{
        background: 'linear-gradient(135deg, #c9a84c, #ef4444)',
        color: '#fff', border: 'none', padding: '16px 32px', borderRadius: '30px',
        fontSize: '16px', fontWeight: '800', cursor: 'pointer',
        boxShadow: '0 10px 25px rgba(201,168,76,0.3)', transition: 'all 0.3s'
      }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
        Upgrade to Premium Now
      </button>
      <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>*One-click demo upgrade. No credit card required.</div>
    </div>
  );

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatting) return;
    const msg = chatInput.trim();
    setChatHistory(prev => [...prev, { role: 'parent', text: msg }]);
    setChatInput('');
    setIsChatting(true);
    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: msg, role: 'parent' })
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory(prev => [...prev, { role: 'ai', text: data.reply }]);
      }
    } catch(e) {}
    setIsChatting(false);
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Brain },
    { id: 'wellbeing', label: 'Wellbeing', icon: Zap },
    { id: 'chat', label: 'AI Assistant', icon: MessageCircle },
    { id: 'weekly', label: 'Weekly Report', icon: FileText },
    { id: 'alerts', label: `Alerts${alerts.length > 0 ? ` (${alerts.length})` : ''}`, icon: Bell },
    { id: 'mood', label: 'Mood Trends', icon: Heart },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '16px',
          background: 'rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(201,168,76,0.3)'
        }}>
          <Brain size={26} color="#c9a84c" />
        </div>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>AI Behavior Insights</h2>
          <p style={{ color: '#c9a84c', fontSize: '12px', fontWeight: '700' }}>Powered by AlphaGuard AI Engine</p>
        </div>
        {alerts.length > 0 && (
          <div style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '20px', padding: '6px 14px'
          }}>
            <AlertTriangle size={14} color="#ef4444" />
            <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '13px' }}>{alerts.length} Alert{alerts.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: tab === t.id ? '2px solid #c9a84c' : '2px solid transparent',
            color: tab === t.id ? '#c9a84c' : 'var(--text-muted)',
            fontWeight: '700', fontSize: '13px', transition: 'all 0.2s'
          }}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <>
          {insights ? (
            <>
              {/* Risk Banner */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '24px', borderRadius: '16px', marginBottom: '20px',
                background: `${insights.riskColor}10`,
                border: `1px solid ${insights.riskColor}40`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Shield size={36} color={insights.riskColor} />
                  <div>
                    <div style={{ fontSize: '36px', fontWeight: '900', color: insights.riskColor, lineHeight: 1 }}>{insights.riskScore}/100</div>
                    <div style={{ color: insights.riskColor, fontWeight: '700', fontSize: '13px', marginTop: '4px' }}>{insights.riskLevel}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  {insights.trend === 'increasing' ? <TrendingUp color="#ef4444" size={20} /> : insights.trend === 'decreasing' ? <TrendingDown color="#10b981" size={20} /> : <Minus size={20} />}
                  <span>Usage {insights.trend}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'AVG DAILY', value: insights.avgDailyFormatted, color: 'var(--accent-cyan)' },
                  { label: 'NIGHT SESSIONS', value: insights.nightSessions, color: insights.nightSessions > 2 ? '#ef4444' : '#fff' },
                  { label: 'UNIQUE APPS', value: insights.uniqueAppsCount, color: 'var(--accent-purple)' },
                ].map((m, i) => (
                  <div key={i} className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '8px' }}>{m.label}</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* AI Insights */}
              <div style={{ marginBottom: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Brain size={14} color="#c9a84c" /> AI ANALYSIS
              </div>
              {insights.insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
            </>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Generating AI insights...</div>
          )}
        </>
      )}

      {/* ── WELLBEING ─────────────────────────────────────────────── */}
      {tab === 'wellbeing' && (
        <div className="glass-card" style={{ padding: '28px' }}>
          {wellbeing ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `rgba(${wellbeing.color === '#10b981' ? '16,185,129' : wellbeing.color === '#ef4444' ? '239,68,68' : '245,158,11'}, 0.1)`, border: `2px solid ${wellbeing.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: wellbeing.color }}>{wellbeing.score}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Wellbeing Score</h3>
                  <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', background: `${wellbeing.color}20`, color: wellbeing.color, fontWeight: '700', fontSize: '12px' }}>
                    {wellbeing.label.toUpperCase()}
                  </div>
                </div>
              </div>

              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                *This score evaluates digital habits, mood, focus consistency, and late-night usage. It is not a medical diagnosis. Data is used strictly for awareness.
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={18} color="#c9a84c" /> AI Parent Guidance
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {wellbeing.insights.map((ins, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', borderLeft: '3px solid #c9a84c' }}>
                    <div style={{ fontWeight: '600', color: '#fff', marginBottom: '8px', fontSize: '15px' }}>{ins.text}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#c9a84c' }}>↳</span> {ins.parentGuidance}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Calculating Wellbeing Score...</div>
          )}
        </div>
      )}

      {/* ── AI ASSISTANT CHAT ─────────────────────────────────────── */}
      {tab === 'chat' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={20} color="#c9a84c" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>AlphaGuard AI Assistant</h3>
              <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '3px', background: '#10b981' }}></div> Online</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {chatHistory.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'parent' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%', padding: '14px 18px', borderRadius: '16px',
                  background: msg.role === 'parent' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                  color: '#fff', fontSize: '14px', lineHeight: '1.5',
                  borderBottomRightRadius: msg.role === 'parent' ? '4px' : '16px',
                  borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '16px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatting && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '14px 18px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '14px', borderBottomLeftRadius: '4px' }}>
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask for parenting advice, digital wellbeing tips..." 
              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '12px', color: '#fff', outline: 'none' }}
            />
            <button 
              onClick={handleSendChat}
              disabled={isChatting || !chatInput.trim()}
              style={{ padding: '0 20px', background: '#c9a84c', border: 'none', borderRadius: '12px', color: '#000', cursor: isChatting || !chatInput.trim() ? 'not-allowed' : 'pointer', opacity: isChatting || !chatInput.trim() ? 0.5 : 1 }}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ── WEEKLY REPORT ────────────────────────────────────────── */}
      {tab === 'weekly' && (
        <div className="glass-card" style={{ padding: '28px' }}>
          {weekly ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <FileText size={20} color="#c9a84c" />
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Weekly AI Summary</h3>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => {
                    const reportData = `Weekly AI Summary\n\nTotal Screen Time: ${weekly.thisWeekTotal}\nChange from last week: ${weekly.percentageChange}%\n\nSummary:\n${weekly.summary}\n\nTop Apps:\n${weekly.topApps?.map((a, i) => `${i+1}. ${a.name} - ${a.time}`).join('\n') || 'None'}`;
                    const blob = new Blob([reportData], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `AlphaGuard_Weekly_Report_${new Date().toISOString().split('T')[0]}.txt`;
                    a.click();
                  }} style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,168,76,0.15)'}>
                    Download Report
                  </button>
                  <div style={{
                    padding: '6px 14px', borderRadius: '20px',
                    background: weekly.percentageChange > 10 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                    color: weekly.percentageChange > 10 ? '#ef4444' : '#10b981',
                    fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    {weekly.percentageChange > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {weekly.percentageChange > 0 ? '+' : ''}{weekly.percentageChange}%
                  </div>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '15px', marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', borderLeft: '3px solid #c9a84c' }}>
                {weekly.summary}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {[{ label: 'This Week', value: weekly.thisWeekTotal }, { label: 'Last Week', value: weekly.lastWeekTotal }].map((w, i) => (
                  <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', marginBottom: '8px' }}>{w.label.toUpperCase()}</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff' }}>{w.value}</div>
                  </div>
                ))}
              </div>

              {weekly.topApps?.length > 0 && (
                <>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', marginBottom: '12px' }}>TOP APPS THIS WEEK</div>
                  {weekly.topApps.map((app, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: '#475569', fontWeight: '900', width: '24px', fontSize: '13px' }}>{i + 1}</span>
                      <span style={{ flex: 1, fontWeight: '600' }}>{app.name}</span>
                      <span style={{ color: '#c9a84c', fontWeight: '700', fontSize: '14px' }}>{app.time}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Generating weekly report...</div>
          )}
        </div>
      )}

      {/* ── ALERTS ──────────────────────────────────────────────── */}
      {tab === 'alerts' && (
        alerts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(16,185,129,0.05)', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.15)' }}>
            <CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '10px' }}>All Clear! 🎉</h3>
            <p style={{ color: 'var(--text-muted)' }}>No unusual activity detected. AlphaGuard AI is monitoring silently.</p>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div key={i} className="glass-card" style={{
              padding: '20px', marginBottom: '12px',
              borderLeft: `3px solid ${alert.severity === 'high' ? '#ef4444' : alert.severity === 'medium' ? '#f59e0b' : '#00f0ff'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <span style={{ fontSize: '20px' }}>{'⚠️'}</span>
                <div>
                  <div style={{ fontWeight: '800', marginBottom: '4px' }}>{alert.title}</div>
                  <div style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700',
                    background: alert.severity === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color: alert.severity === 'high' ? '#ef4444' : '#f59e0b'
                  }}>{alert.severity.toUpperCase()} PRIORITY</div>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>{alert.message}</p>
            </div>
          ))
        )
      )}

      {/* ── MOOD TRENDS ─────────────────────────────────────────── */}
      {tab === 'mood' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Heart size={18} color="#ef4444" />
            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Child Emotional Check-in History</h3>
          </div>
          {checkins.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
              No mood check-ins yet. The child can submit check-ins from their device.
            </p>
          ) : checkins.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '24px' }}>{MOOD_EMOJIS[c.mood] || '😐'}</span>
              <div>
                <div style={{ fontWeight: '700', marginBottom: '2px' }}>{c.mood.charAt(0).toUpperCase() + c.mood.slice(1)}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{c.date}</div>
                {c.note && <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', fontStyle: 'italic' }}>"{c.note}"</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIInsights;
