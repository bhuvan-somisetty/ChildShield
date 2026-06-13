import React, { useState } from 'react';
import { Target, Plus, Trash2, Check, X, Trophy } from 'lucide-react';
import { useChildApp } from '../../../child/ChildAppContext';
import { Page, Card, Label } from './ui';

const SUBJECTS = ['Mathematics', 'English', 'Science', 'History', 'Art', 'Other'];

const Goals = () => {
  const { goals, toggleGoal, addGoal, removeGoal } = useChildApp();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', subject: 'Mathematics', target: 'Today' });
  const done = goals.filter((g) => g.done).length;
  const pct = goals.length ? Math.round((done / goals.length) * 100) : 0;
  const save = () => { if (!form.title.trim()) return; addGoal(form); setForm({ title: '', subject: 'Mathematics', target: 'Today' }); setAdding(false); };

  return (
    <Page title="Study Goals" sub="Stay on track and earn points" back right={<button onClick={() => setAdding((v) => !v)} aria-label="Add goal" className="ag-tap w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">{adding ? <X size={18} className="text-amber-400" /> : <Plus size={18} className="text-amber-400" />}</button>}>
      {/* Progress */}
      <Card className="p-5 flex items-center gap-5">
        <div className="relative w-[78px] h-[78px] flex-shrink-0">
          <svg width="78" height="78" className="-rotate-90"><circle cx="39" cy="39" r="30" stroke="rgba(255,255,255,0.08)" strokeWidth="7" fill="none" /><circle cx="39" cy="39" r="30" stroke="#f59e0b" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 30} strokeDashoffset={2 * Math.PI * 30 * (1 - pct / 100)} /></svg>
          <div className="absolute inset-0 flex items-center justify-center text-white font-black text-[17px]">{pct}%</div>
        </div>
        <div className="flex-1"><p className="text-slate-400 text-[12px] font-bold uppercase tracking-wide">Today’s progress</p><p className="text-white font-black text-[17px] mt-0.5">{done} of {goals.length} done</p><p className="text-amber-400 text-[12.5px] font-bold mt-1 flex items-center gap-1"><Trophy size={14} /> +{done * 20} points</p></div>
      </Card>

      {adding && (
        <Card className="p-4 flex flex-col gap-2.5">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What do you want to do?" className="h-12 rounded-2xl bg-[#11131d] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-amber-400/40" />
          <div className="flex gap-2 overflow-x-auto ag-no-scrollbar">{SUBJECTS.map((sub) => <button key={sub} onClick={() => setForm({ ...form, subject: sub })} className={`ag-tap flex-shrink-0 h-9 px-3.5 rounded-full text-[12px] font-bold border ${form.subject === sub ? 'bg-amber-500/15 border-amber-400/40 text-amber-300' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`}>{sub}</button>)}</div>
          <div className="flex gap-2">{['Today', 'This week'].map((tg) => <button key={tg} onClick={() => setForm({ ...form, target: tg })} className={`ag-tap flex-1 h-10 rounded-xl text-[12.5px] font-bold border ${form.target === tg ? 'bg-amber-500/15 border-amber-400/40 text-amber-300' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`}>{tg}</button>)}</div>
          <button onClick={save} disabled={!form.title.trim()} className="ag-tap h-11 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-300 font-bold text-[13px] flex items-center justify-center gap-2 disabled:opacity-40"><Plus size={16} /> Add Goal</button>
        </Card>
      )}

      <Label>My Goals</Label>
      <Card className="divide-y divide-white/[0.05]">
        {goals.length === 0 ? <p className="text-slate-500 text-[13px] font-semibold text-center py-8">No goals yet — add one!</p> : goals.map((g) => (
          <div key={g.id} className="flex items-center gap-3 p-3.5">
            <button onClick={() => toggleGoal(g.id)} aria-label={g.done ? 'Mark not done' : 'Mark done'} className={`ag-tap w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${g.done ? 'bg-emerald-500 border-transparent' : 'border-white/25'}`}>{g.done && <Check size={14} className="text-[#030307]" strokeWidth={3.5} />}</button>
            <div className="flex-1 min-w-0"><p className={`font-bold text-[14px] truncate ${g.done ? 'text-slate-500 line-through' : 'text-white'}`}>{g.title}</p><p className="text-slate-500 text-[12px] font-semibold truncate">{g.subject} · {g.target}</p></div>
            <button onClick={() => removeGoal(g.id)} aria-label="Remove goal" className="ag-tap w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0"><Trash2 size={14} className="text-slate-400" /></button>
          </div>
        ))}
      </Card>
    </Page>
  );
};

export default Goals;
