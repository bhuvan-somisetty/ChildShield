import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './agClient';
import { ensureSession } from './session';

// Triple-state visual metadata. Cycle order: ⬜ → ✅ → ❌ → ⬜
export const STATE_ORDER = ['not_started', 'completed', 'failed'];
export const STATE_META = {
  not_started: { icon: '⬜', label: 'Not Started', color: '#64748b' },
  completed:   { icon: '✅', label: 'Completed',  color: '#10b981' },
  failed:      { icon: '❌', label: 'Failed',     color: '#f43f5e' },
};
export const nextState = (s) => STATE_ORDER[(STATE_ORDER.indexOf(s) + 1) % STATE_ORDER.length];

export const CATEGORIES = ['Homework', 'Study', 'Reading', 'Coding', 'Exercise', 'Chores', 'Health', 'School', 'Custom'];
export const CATEGORY_COLOR = { Homework: '#6366f1', Study: '#3b82f6', Reading: '#06b6d4', Coding: '#a855f7', Exercise: '#f59e0b', Chores: '#64748b', Health: '#10b981', School: '#ec4899', Custom: '#94a3b8' };
// Agenda buckets from a list of tasks with dueAt (YYYY-MM-DD).
export const bucketByAgenda = (tasks) => {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const out = { overdue: [], today: [], tomorrow: [], upcoming: [] };
  tasks.forEach((t) => {
    const due = t.dueAt ? String(t.dueAt).slice(0, 10) : null;
    if (!due) { out.upcoming.push(t); return; }
    if (t.completionState === 'not_started' && due < today) out.overdue.push(t);
    else if (due === today) out.today.push(t);
    else if (due === tomorrow) out.tomorrow.push(t);
    else if (due > tomorrow) out.upcoming.push(t);
    else out.today.push(t);
  });
  return out;
};

// Loads tasks for the given role (parent passes the selected childId) and keeps
// them live over Socket.IO (task:upserted / task:deleted from the shared family
// room). Reuses the cached socket session — no second connection.
export function useTasks(role, childId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const childIdRef = useRef(childId);
  childIdRef.current = childId;

  const reload = useCallback(async () => {
    if (role === 'parent' && !childId) { setTasks([]); setLoading(false); return; }
    try {
      const { tasks: list } = await api.listTasks(role === 'parent' ? childId : undefined);
      setTasks(list); setError('');
    } catch (e) {
      setError(e.message || 'Could not load tasks');
    } finally {
      setLoading(false);
    }
  }, [role, childId]);

  useEffect(() => { setLoading(true); reload(); }, [reload]);

  useEffect(() => {
    let off = () => {};
    ensureSession(role).then((sess) => {
      const s = sess.socket;
      const onUpsert = (t) => {
        if (role === 'parent' && childIdRef.current && t.childId !== childIdRef.current) return;
        setTasks((prev) => {
          const i = prev.findIndex((x) => x.id === t.id);
          if (i === -1) return [...prev, t];
          const next = prev.slice(); next[i] = t; return next;
        });
      };
      const onDelete = ({ id }) => setTasks((prev) => prev.filter((x) => x.id !== id));
      s.on('task:upserted', onUpsert);
      s.on('task:deleted', onDelete);
      off = () => { s.off('task:upserted', onUpsert); s.off('task:deleted', onDelete); };
    }).catch(() => { /* offline → REST-only */ });
    return () => off();
  }, [role]);

  // Optimistic triple-state cycle, reconciled by the server echo.
  const cycle = useCallback(async (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completionState: nextState(t.completionState) } : t)));
    try {
      const { task } = await api.cycleTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    } catch {
      reload();
    }
  }, [reload]);

  return { tasks, loading, error, reload, setTasks, cycle };
}
