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
