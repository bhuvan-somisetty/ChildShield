import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ListTodo, BarChart3, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui';
import { api } from '../../lib/agClient';
import { useTasks, STATE_META, CATEGORY_COLOR, bucketByAgenda } from '../../lib/useTasks';

const TABS = [['agenda', 'Agenda', ListTodo], ['calendar', 'Calendar', CalendarDays], ['productivity', 'Productivity', BarChart3]];
const dkey = (d) => d.toISOString().slice(0, 10);

const TaskRow = ({ t }) => {
  const m = STATE_META[t.completionState] || STATE_META.not_started;
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
      <span className="text-[16px]">{m.icon}</span>
      <div className="flex-1 min-w-0"><p className={`text-[13.5px] font-bold truncate ${t.completionState === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>{t.title}</p></div>
      {t.category && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: `${CATEGORY_COLOR[t.category] || '#64748b'}1a`, color: CATEGORY_COLOR[t.category] || '#94a3b8' }}>{t.category}</span>}
    </div>
  );
};

const Agenda = ({ tasks }) => {
  const b = bucketByAgenda(tasks.filter((t) => !t.deleted));
  const Section = ({ title, items, accent, icon: Icon }) => items.length === 0 ? null : (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2 px-1">{Icon && <Icon size={14} style={{ color: accent }} />}<p className="text-[12px] font-black uppercase tracking-wide" style={{ color: accent }}>{title} · {items.length}</p></div>
      <div className="flex flex-col gap-1.5">{items.map((t) => <TaskRow key={t.id} t={t} />)}</div>
    </div>
  );
  const empty = b.overdue.length + b.today.length + b.tomorrow.length + b.upcoming.length === 0;
  return (
    <div>
      <Section title="Overdue" items={b.overdue} accent="#f43f5e" icon={AlertTriangle} />
      <Section title="Today" items={b.today} accent="#06b6d4" />
      <Section title="Tomorrow" items={b.tomorrow} accent="#3b82f6" />
      <Section title="Upcoming" items={b.upcoming} accent="#a855f7" />
      {empty && <p className="text-slate-500 text-[13px] font-semibold text-center py-10">Nothing scheduled. Add tasks with due dates to plan ahead.</p>}
    </div>
  );
};

const Calendar = ({ tasks }) => {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState(dkey(new Date()));
  const byDay = {};
  tasks.forEach((t) => { if (t.dueAt) { const k = String(t.dueAt).slice(0, 10); (byDay[k] = byDay[k] || []).push(t); } });
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startPad = first.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(startPad).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const monthName = month.toLocaleString('default', { month: 'long', year: 'numeric' });
  const selTasks = byDay[sel] || [];
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="ag-tap w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={18} /></button>
        <p className="text-white font-black text-[15px]">{monthName}</p>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="ag-tap w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-center text-slate-600 text-[11px] font-black py-1">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const k = dkey(d); const has = (byDay[k] || []).length; const isSel = k === sel; const isToday = k === dkey(new Date());
          return (
            <button key={i} onClick={() => setSel(k)} className={`ag-tap aspect-square rounded-xl flex flex-col items-center justify-center text-[13px] font-bold border ${isSel ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300' : isToday ? 'border-white/20 text-white' : 'border-transparent text-slate-300'}`}>
              {d.getDate()}
              {has > 0 && <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <p className="text-slate-400 text-[12px] font-black uppercase tracking-wide mb-2">{new Date(sel + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        {selTasks.length === 0 ? <p className="text-slate-500 text-[13px] font-semibold py-4 text-center">No tasks this day.</p> : <div className="flex flex-col gap-1.5">{selTasks.map((t) => <TaskRow key={t.id} t={t} />)}</div>}
      </div>
    </div>
  );
};

const Productivity = ({ childId }) => {
  const [m, setM] = useState(null);
  useEffect(() => { if (childId) api.generateReport(childId, 'weekly').then((r) => setM(r.report.metrics)).catch(() => {}); }, [childId]);
  if (!m) return <p className="text-slate-500 text-[13px] font-semibold text-center py-10">Computing productivity…</p>;
  const Box = ({ label, value, color }) => <Card className="p-3.5"><p className="text-[22px] font-black leading-none" style={{ color }}>{value}</p><p className="text-slate-500 text-[11px] font-bold mt-1">{label}</p></Card>;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <Box label="Weekly Completion" value={`${m.taskCompletionPct}%`} color="#10b981" />
        <Box label="Current Streak" value={`${m.currentTaskStreak}d`} color="#f59e0b" />
        <Box label="Completed" value={m.tasksCompleted} color="#10b981" />
        <Box label="Failed" value={m.tasksFailed} color="#f43f5e" />
        <Box label="Recurring Success" value={`${m.recurringSuccessRate}%`} color="#06b6d4" />
        <Box label="Trend" value={`${m.trendDelta >= 0 ? '+' : ''}${m.trendDelta}%`} color={m.trendDelta >= 0 ? '#10b981' : '#f43f5e'} />
      </div>
      {m.categories?.length > 0 && (
        <Card className="p-4 flex flex-col gap-3">
          <p className="text-slate-400 text-[12px] font-bold uppercase tracking-wide">Category Breakdown</p>
          {m.categories.map((c) => (
            <div key={c.category}><div className="flex justify-between mb-1"><span className="text-white text-[13px] font-bold">{c.category}</span><span className="text-slate-400 text-[12px] font-black">{c.completionPct}%</span></div>
              <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${c.completionPct}%`, background: CATEGORY_COLOR[c.category] || '#06b6d4' }} /></div></div>
          ))}
        </Card>
      )}
      <Card className="p-4 border-amber-500/20 bg-amber-500/[0.05]"><p className="text-amber-300 text-[12px] font-black uppercase mb-0.5">Recommendation</p><p className="text-slate-300 text-[13.5px] font-medium">{m.recommendation}</p></Card>
    </div>
  );
};

const Planner = () => {
  const [child, setChild] = useState(null);
  const [tab, setTab] = useState('agenda');
  const { tasks } = useTasks('parent', child?.id);
  useEffect(() => { api.listChildren().then((r) => setChild((r.children || [])[0] || null)).catch(() => {}); }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center"><CalendarDays size={18} className="text-cyan-400" /></div>
        <div><h1 className="text-[19px] font-black text-white tracking-tight leading-none">Planner</h1>{child && <p className="text-slate-500 text-[12px] font-semibold mt-1">{child.name}</p>}</div>
      </div>
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
        {TABS.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`ag-tap flex-1 h-9 rounded-xl text-[12.5px] font-bold inline-flex items-center justify-center gap-1.5 ${tab === id ? 'bg-white/[0.08] text-white' : 'text-slate-500'}`}><Icon size={14} /> {label}</button>)}
      </div>
      {!child ? <Card className="p-6"><p className="text-slate-400 text-[13px] font-semibold text-center">Connect a child to plan tasks.</p></Card>
        : tab === 'agenda' ? <Agenda tasks={tasks} />
        : tab === 'calendar' ? <Calendar tasks={tasks} />
        : <Productivity childId={child.id} />}
    </div>
  );
};

export default Planner;
