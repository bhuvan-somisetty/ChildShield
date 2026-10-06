import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Flame, Clock, Target as TargetIcon, ShieldCheck, Lightbulb, CheckCircle2, Activity } from 'lucide-react';
import { Card } from '../../components/ui';
import { api } from '../../lib/agClient';

const PERIODS = [{ id: 'daily', label: 'Daily' }, { id: 'weekly', label: 'Weekly' }, { id: 'monthly', label: 'Monthly' }];
const RISK_COLOR = { Low: '#10b981', Medium: '#f59e0b', High: '#f43f5e' };

const Metric = ({ icon: Icon, label, value, color }) => (
  <Card className="p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}1a`, border: `1px solid ${color}40` }}><Icon size={18} style={{ color }} /></div>
    <div className="min-w-0"><p className="text-slate-500 text-[11.5px] font-bold uppercase tracking-wide">{label}</p><p className="text-white text-[16px] font-black leading-tight truncate">{value}</p></div>
  </Card>
);

const AIReports = () => {
  const [child, setChild] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.listChildren().then((r) => setChild((r.children || [])[0] || null)).catch(() => {}); }, []);

  const generate = useCallback(async () => {
    if (!child) return;
    setBusy(true); setError('');
    try { const { report: rep } = await api.generateReport(child.id, period); setReport(rep); }
    catch (e) { setError(e.message || 'Could not generate report'); }
    finally { setBusy(false); }
  }, [child, period]);

  useEffect(() => { if (child) generate(); }, [child, period]); // eslint-disable-line

  const m = report?.metrics;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-400/30 flex items-center justify-center"><Sparkles size={18} className="text-violet-400" /></div>
        <div><h1 className="text-[19px] font-black text-white tracking-tight leading-none">AI Reports</h1>{child && <p className="text-slate-500 text-[12px] font-semibold mt-1">{child.name}</p>}</div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
        {PERIODS.map((p) => <button key={p.id} onClick={() => setPeriod(p.id)} className={`ag-tap flex-1 h-9 rounded-xl text-[13px] font-bold ${period === p.id ? 'bg-white/[0.08] text-white' : 'text-slate-500'}`}>{p.label}</button>)}
      </div>

      {!child && <Card className="p-6"><p className="text-slate-400 text-[13px] font-semibold text-center">Connect a child device to generate reports.</p></Card>}
      {error && <Card className="p-4"><p className="text-rose-400 text-[13px] font-semibold text-center">{error}</p></Card>}
      {busy && <p className="text-slate-500 text-[13px] font-semibold text-center py-6">Analyzing real activity…</p>}

      {m && !busy && (
        <>
          <Card className="p-5" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(37,99,235,0.06))' }}>
            <p className="text-slate-300 text-[13.5px] font-medium leading-relaxed">{report.summary}</p>
          </Card>

          {/* Family insights — derived from approval / discussion / consistency */}
          {m.insights?.length > 0 && (
            <Card className="p-4 flex flex-col gap-2.5">
              <p className="text-violet-300 text-[12px] font-black uppercase tracking-wide inline-flex items-center gap-1.5"><Sparkles size={14} /> Family Insights</p>
              {m.insights.map((it, i) => (
                <div key={i} className="flex items-start gap-2.5"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" /><p className="text-slate-300 text-[13px] font-medium leading-relaxed">{it}</p></div>
              ))}
            </Card>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <Metric icon={TrendingUp} label="Task Completion" value={`${m.taskCompletionPct}%`} color="#10b981" />
            <Metric icon={Flame} label="Study Streak" value={`${m.currentTaskStreak} days`} color="#f59e0b" />
            {m.approval?.decisions > 0 && <Metric icon={CheckCircle2} label="Approval Rate" value={`${m.approval.approvalRate}%`} color="#22c55e" />}
            {m.consistency && <Metric icon={Activity} label="Consistency" value={`${m.consistency.consistencyPct}%${m.consistency.delta > 0 ? ` ↑${m.consistency.delta}` : ''}`} color="#06b6d4" />}
            <Metric icon={TargetIcon} label="Avg Target" value={`${m.avgTargetProgress}%`} color="#6366f1" />
            <Metric icon={ShieldCheck} label="Risk Level" value={m.riskLevel} color={RISK_COLOR[m.riskLevel] || '#64748b'} />
          </div>

          {(m.approval?.decisions > 0 || m.discussions?.totalMessages > 0) && (
            <Card className="p-4 flex flex-col gap-2.5">
              <p className="text-slate-400 text-[12px] font-bold uppercase tracking-wide">Verification &amp; Communication</p>
              <div className="flex items-center justify-between"><span className="text-slate-400 text-[13px] font-medium">Tasks approved</span><span className="text-emerald-300 text-[13px] font-black">{m.approval.approved} / {m.approval.decisions}</span></div>
              {m.approval.pendingApproval > 0 && <div className="flex items-center justify-between"><span className="text-slate-400 text-[13px] font-medium">Awaiting review</span><span className="text-amber-300 text-[13px] font-black">{m.approval.pendingApproval}</span></div>}
              <div className="flex items-center justify-between"><span className="text-slate-400 text-[13px] font-medium">Task messages</span><span className="text-cyan-300 text-[13px] font-black">{m.discussions.totalMessages}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-400 text-[13px] font-medium">Parent engagement</span><span className="text-white text-[13px] font-black capitalize">{m.parentEngagement?.level || 'low'}</span></div>
              {m.discussions.mostDiscussed?.[0] && <div className="flex items-center justify-between"><span className="text-slate-400 text-[13px] font-medium">Most discussed</span><span className="text-white text-[13px] font-black">{m.discussions.mostDiscussed[0].category}</span></div>}
            </Card>
          )}

          {m.targets?.length > 0 && (
            <Card className="p-4 flex flex-col gap-3">
              <p className="text-slate-400 text-[12px] font-bold uppercase tracking-wide">Goal Progress</p>
              {m.targets.map((t) => (
                <div key={t.id}>
                  <div className="flex items-center justify-between mb-1"><span className="text-white text-[13px] font-bold truncate">{t.title}</span><span className="text-slate-400 text-[12px] font-black">{t.progress}%</span></div>
                  <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${t.progress}%` }} /></div>
                </div>
              ))}
            </Card>
          )}

          <Card className="p-4 flex items-start gap-3 border-amber-500/20 bg-amber-500/[0.05]">
            <Lightbulb size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div><p className="text-amber-300 text-[12px] font-black uppercase tracking-wide mb-0.5">Recommendation</p><p className="text-slate-300 text-[13.5px] font-medium leading-relaxed">{m.recommendation}</p></div>
          </Card>
        </>
      )}
    </div>
  );
};

export default AIReports;
