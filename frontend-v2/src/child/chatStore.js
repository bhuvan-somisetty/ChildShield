// Child-side view of the parent↔child conversation. Uses the SAME localStorage
// key the parent dashboard uses (`ag_chat_v1`, keyed by child id), so messages
// stay compatible across both apps. A socket replaces this later.
const K = 'ag_chat_v1';

const all = () => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch { return {}; } };
const persist = (obj) => { try { localStorage.setItem(K, JSON.stringify(obj)); } catch { /* noop */ } };

export const loadChat = (childId) => all()[childId] || [];

export const sendChildMsg = (childId, text) => {
  const obj = all();
  const arr = obj[childId] || [];
  arr.push({ id: `c${Date.now()}`, from: 'child', text, at: Date.now(), status: 'sent' });
  obj[childId] = arr; persist(obj);
  return arr;
};

export const receiveParentMsg = (childId, text) => {
  const obj = all();
  const arr = obj[childId] || [];
  arr.push({ id: `p${Date.now()}`, from: 'parent', text, at: Date.now(), status: 'read' });
  obj[childId] = arr; persist(obj);
  return arr;
};
