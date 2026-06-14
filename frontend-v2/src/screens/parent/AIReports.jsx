import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Flame, Clock, Target as TargetIcon, ShieldCheck, Lightbulb } from 'lucide-react';
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
          <div className="grid grid-cols-2 gap-2.5">
            <Metric icon={TrendingUp} label="Task Completion" value={`${m.taskCompletionPct}%`} color="#10b981" />
            <Metric icon={Flame} label="Study Streak" value={`${m.currentTaskStreak} days`} color="#f59e0b" />
            <Metric icon={Clock} label="Most Productive" value={m.mostProductiveTime || 'N/A'} color="#06b6d4" />
            <Metric icon={TargetIcon} label="Avg Target" value={`${m.avgTargetProgress}%`} color="#6366f1" />
            <Metric icon={ShieldCheck} label="Risk Level" value={m.riskLevel} color={RISK_COLOR[m.riskLevel] || '#64748b'} />
            <Metric icon={TrendingUp} label="Tasks Failed" value={`${m.taskFailurePct}%`} color="#f43f5e" />
          </div>

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
