import { useState, useEffect, useCallback, useRef } from 'react';
import { ensureSession } from './session';

// Generic realtime collection hook used by Targets and Rewards. Loads via the
// supplied REST fn and stays live over Socket.IO (`${name}:upserted` /
// `${name}:deleted`). Reuses the cached socket session — no extra connection.
export function useLiveList(role, childId, { name, load }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const childRef = useRef(childId); childRef.current = childId;

  const reload = useCallback(async () => {
    if (role === 'parent' && !childId) { setItems([]); setLoading(false); return; }
    try { setItems(await load(role === 'parent' ? childId : undefined)); setError(''); }
    catch (e) { setError(e.message || 'Could not load'); }
    finally { setLoading(false); }
  }, [role, childId, load]);

  useEffect(() => { setLoading(true); reload(); }, [reload]);

  useEffect(() => {
    let off = () => {};
    ensureSession(role).then((sess) => {
      const s = sess.socket;
      const onUpsert = (it) => {
        if (role === 'parent' && childRef.current && it.childId !== childRef.current) return;
        setItems((prev) => { const i = prev.findIndex((x) => x.id === it.id); if (i === -1) return [...prev, it]; const n = prev.slice(); n[i] = it; return n; });
      };
      const onDelete = ({ id }) => setItems((prev) => prev.filter((x) => x.id !== id));
      s.on(`${name}:upserted`, onUpsert);
      s.on(`${name}:deleted`, onDelete);
      off = () => { s.off(`${name}:upserted`, onUpsert); s.off(`${name}:deleted`, onDelete); };
    }).catch(() => {});
    return () => off();
  }, [role, name]);

  return { items, setItems, loading, error, reload };
}

export const TARGET_STATUS = {
  not_started: { label: 'Not Started', color: '#64748b' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  completed: { label: 'Completed', color: '#10b981' },
  failed: { label: 'Failed', color: '#f43f5e' },
};
export const REWARD_STATUS = {
  pending: { label: 'Pending', color: '#f59e0b' },
  unlocked: { label: 'Unlocked', color: '#10b981' },
  delivered: { label: 'Delivered', color: '#06b6d4' },
};
