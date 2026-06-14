import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, BookOpen, Dumbbell, CheckCircle2 } from 'lucide-react';
import { ensureSession } from '../../../lib/session';
import { api } from '../../../lib/agClient';

const KIND_META = {
  task_completion: { label: 'Task Streak', icon: CheckCircle2, color: '#10b981' },
  study: { label: 'Study Streak', icon: BookOpen, color: '#6366f1' },
  reading: { label: 'Reading Streak', icon: BookOpen, color: '#06b6d4' },
  exercise: { label: 'Exercise Streak', icon: Dumbbell, color: '#f59e0b' },
};
const MILESTONES = [3, 7, 14, 30, 60, 90];

const ChildAchievements = () => {
  const [streaks, setStreaks] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [childId, setChildId] = useState(null);

  const load = useCallback(async (cid) => {
    const [s, a] = await Promise.all([api.streaks(cid), api.achievements(cid)]);
    setStreaks(s.streaks); setAchievements(a.achievements);
  }, []);

  useEffect(() => {
    let mounted = true;
    api.me().then((r) => { const cid = r.child?.id; if (cid && mounted) { setChildId(cid); load(cid); } }).catch(() => {});
    return () => { mounted = false; };
  }, [load]);

  // Live updates: streak:updated / achievement:unlocked
  useEffect(() => {
    let off = () => {};
    ensureSession('child').then((sess) => {
      const s = sess.socket;
      const onStreak = (st) => setStreaks((p) => { const i = p.findIndex((x) => x.kind === st.kind); if (i === -1) return [...p, st]; const n = p.slice(); n[i] = st; return n; });
      const onAch = (a) => setAchievements((p) => (p.some((x) => x.id === a.id) ? p : [a, ...p]));
      s.on('streak:updated', onStreak); s.on('achievement:unlocked', onAch);
      off = () => { s.off('streak:updated', onStreak); s.off('achievement:unlocked', onAch); };
    }).catch(() => {});
    return () => off();
  }, []);

  const taskStreak = streaks.find((s) => s.kind === 'task_completion')?.current || 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[24px] font-black text-white tracking-tight leading-none">Achievements</h1>
        <p className="text-amber-400/90 text-[13px] font-bold mt-1.5">Keep your streaks alive 🔥</p>
      </div>

      {/* Hero streak */}
      <div className="relative p-6 rounded-[28px] overflow-hidden border border-amber-400/30" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.18),rgba(239,68,68,0.08))' }}>
        <div className="flex items-center gap-4">
          <div className="relative"><Flame size={48} className="text-amber-400" /><motion.div className="absolute -inset-2 rounded-full bg-amber-500/30 blur-xl -z-10" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} /></div>
          <div><p className="text-[40px] font-black text-white leading-none">{taskStreak}</p><p className="text-amber-300 text-[13px] font-bold">day task streak</p></div>
        </div>
      </div>

      {/* All streaks */}
      <div className="grid grid-cols-2 gap-2.5">
        {Object.entries(KIND_META).map(([kind, m]) => {
          const cur = streaks.find((s) => s.kind === kind)?.current || 0;
          return (
            <div key={kind} className="p-3.5 rounded-2xl border bg-[#0b0f0d]" style={{ borderColor: cur > 0 ? `${m.color}40` : 'rgba(255,255,255,0.08)' }}>
              <m.icon size={18} style={{ color: m.color }} />
              <p className="text-white text-[20px] font-black mt-1.5 leading-none">{cur}</p>
              <p className="text-slate-500 text-[11px] font-bold mt-0.5">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Unlocked badges */}
      <div className="flex flex-col gap-2">
        <p className="text-slate-500 text-[12px] font-bold uppercase tracking-wide">Badges</p>
        {achievements.length === 0 ? (
          <p className="text-slate-500 text-[13px] font-semibold py-4 text-center">Reach {MILESTONES[0]} days to earn your first badge.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {achievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center"><Trophy size={18} className="text-amber-400" /></div>
                <div className="flex-1"><p className="text-white font-bold text-[14px]">{a.title}</p><p className="text-slate-500 text-[11.5px] font-semibold">{new Date(a.at).toLocaleDateString()}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildAchievements;
