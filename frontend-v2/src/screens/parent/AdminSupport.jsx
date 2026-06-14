import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldAlert, Send, Lock } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { api } from '../../lib/agClient';
import { ensureSession } from '../../lib/session';

const STATUSES = ['open', 'investigating', 'in_progress', 'waiting_user', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const SC = { open: '#3b82f6', investigating: '#f59e0b', in_progress: '#a855f7', waiting_user: '#06b6d4', resolved: '#10b981', closed: '#64748b' };
const label = (s) => s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const Stat = ({ label, value, color }) => (
  <Card className="p-3.5 flex-1"><p className="text-[24px] font-black leading-none" style={{ color }}>{value}</p><p className="text-slate-500 text-[11px] font-bold mt-1">{label}</p></Card>
);

const AdminSupport = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState(undefined); // undefined=loading
  const [data, setData] = useState({ stats: {}, tickets: [] });
  const [sel, setSel] = useState(null); // detail thread
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);

  const loadList = useCallback(() => api.adminTickets().then(setData).catch(() => {}), []);
  useEffect(() => { api.me().then((r) => { setMe(r); if (r.admin) loadList(); }).catch(() => setMe({ admin: false })); }, [loadList]);

  // Realtime: new tickets / updates / comments land instantly.
  useEffect(() => {
    if (!me?.admin) return undefined;
    let off = () => {};
    ensureSession('parent').then((sess) => {
      const s = sess.socket;
      const refresh = () => loadList();
      const onComment = (d) => { refresh(); setSel((cur) => (cur && cur.ticket.id === d.ticketId ? null : cur)); };
      s.on('support:ticket-new', refresh); s.on('support:ticket-update', refresh); s.on('support:ticket-comment', onComment);
      off = () => { s.off('support:ticket-new', refresh); s.off('support:ticket-update', refresh); s.off('support:ticket-comment', onComment); };
    }).catch(() => {});
    return () => off();
  }, [me, loadList]);

  const openTicket = async (id) => { const t = await api.adminTicket(id); setSel(t); };
  const setStatus = async (status) => { await api.adminUpdateTicket(sel.ticket.id, { status }); openTicket(sel.ticket.id); loadList(); };
  const setPriority = async (priority) => { await api.adminUpdateTicket(sel.ticket.id, { priority }); openTicket(sel.ticket.id); loadList(); };
  const send = async () => { if (!reply.trim()) return; const r = await api.adminReplyTicket(sel.ticket.id, reply.trim(), internal); setSel(r); setReply(''); setInternal(false); };

  if (me === undefined) return <p className="text-slate-500 text-[13px] font-semibold text-center py-10">Loading…</p>;
  if (!me.admin) return (
    <div className="flex flex-col items-center text-center gap-3 py-16">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center"><Lock size={26} className="text-rose-400" /></div>
      <p className="text-white font-black text-[16px]">Admin access only</p>
      <p className="text-slate-500 text-[13px] font-semibold max-w-[260px]">This area is restricted to AlphaGuard platform administrators.</p>
      <button onClick={() => navigate('/app/home')} className="ag-tap mt-2 h-11 px-5 rounded-full bg-white/[0.06] border border-white/10 text-white font-bold text-[13px]">Back to Dashboard</button>
    </div>
  );

  // Ticket detail
  if (sel) {
    const { ticket, comments } = sel;
    return (
      <div>
        <div className="flex items-center gap-3 mb-4"><button onClick={() => setSel(null)} className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button><h1 className="text-[18px] font-black text-white">Ticket #{ticket.ticketNumber}</h1></div>
        <Card className="p-4 mb-3">
          <p className="text-white font-black text-[15px]">{ticket.title}</p>
          <p className="text-slate-400 text-[13px] font-medium mt-1.5">{ticket.description}</p>
          {ticket.steps && <p className="text-slate-500 text-[12px] font-medium mt-2">Steps: {ticket.steps}</p>}
          <p className="text-slate-600 text-[11px] font-bold mt-2">{ticket.device} · {ticket.browser} · v{ticket.appVersion}</p>
        </Card>
        <p className="text-slate-500 text-[11px] font-black uppercase mb-1.5">Status</p>
        <div className="flex flex-wrap gap-1.5 mb-3">{STATUSES.map((s) => <button key={s} onClick={() => setStatus(s)} className={`ag-tap h-8 px-3 rounded-lg text-[12px] font-bold border ${ticket.status === s ? '' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`} style={ticket.status === s ? { background: `${SC[s]}1f`, borderColor: `${SC[s]}66`, color: SC[s] } : undefined}>{label(s)}</button>)}</div>
        <p className="text-slate-500 text-[11px] font-black uppercase mb-1.5">Priority</p>
        <div className="flex gap-1.5 mb-4">{PRIORITIES.map((p) => <button key={p} onClick={() => setPriority(p)} className={`ag-tap flex-1 h-8 rounded-lg text-[12px] font-bold capitalize border ${ticket.priority === p ? 'bg-white/[0.08] text-white border-white/20' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`}>{p}</button>)}</div>
        <div className="flex flex-col gap-2 mb-3">
          {comments.map((c) => (
            <div key={c.id} className={`p-3 rounded-2xl border ${c.internal ? 'bg-amber-500/[0.06] border-amber-500/20' : c.authorRole === 'admin' ? 'self-end bg-cyan-500/[0.06] border-cyan-500/15' : 'self-start bg-indigo-500/[0.06] border-indigo-500/15'} max-w-[88%]`}>
              <p className="text-[10px] font-black uppercase mb-0.5" style={{ color: c.internal ? '#f59e0b' : c.authorRole === 'admin' ? '#06b6d4' : '#818cf8' }}>{c.internal ? 'Internal note' : c.authorRole === 'admin' ? 'You (Support)' : 'User'}</p>
              <p className="text-slate-200 text-[13px] font-medium">{c.body}</p>
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /><span className="text-slate-400 text-[12.5px] font-semibold">Internal note (not visible to user)</span></label>
        <div className="flex items-center gap-2"><input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={internal ? 'Internal note…' : 'Reply to user…'} className="flex-1 h-11 rounded-2xl bg-[#0b0c14] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none" /><button onClick={send} className="ag-tap w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"><Send size={17} className="text-white" /></button></div>
      </div>
    );
  }

  // Dashboard
  const s = data.stats;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center"><ShieldAlert size={18} className="text-rose-400" /></div><div><h1 className="text-[19px] font-black text-white tracking-tight leading-none">Admin Support</h1><p className="text-slate-500 text-[12px] font-semibold mt-1">{me.parent?.email}</p></div></div>
      <div className="flex gap-2.5"><Stat label="Open" value={s.open ?? 0} color="#3b82f6" /><Stat label="Critical" value={s.critical ?? 0} color="#f43f5e" /><Stat label="Resolved" value={s.resolved ?? 0} color="#10b981" /></div>
      <Card className="p-3.5"><p className="text-slate-500 text-[11px] font-bold">Avg resolution time</p><p className="text-white text-[16px] font-black">{s.avgResolutionHours ?? 0} h</p></Card>
      <p className="text-slate-500 text-[11px] font-black uppercase tracking-wide px-1">All tickets ({data.tickets.length})</p>
      <div className="flex flex-col gap-2.5">
        {data.tickets.map((t) => (
          <button key={t.id} onClick={() => openTicket(t.id)} className="ag-tap text-left"><Card className="p-3.5">
            <div className="flex items-center justify-between"><span className="text-slate-500 text-[12px] font-black">#{t.ticketNumber} · {t.issueType}</span><span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: `${SC[t.status]}1a`, color: SC[t.status] }}>{label(t.status)}</span></div>
            <p className="text-white font-bold text-[14.5px] mt-1.5">{t.title}</p>
            <p className="text-slate-600 text-[11px] font-bold mt-1">{t.priority} priority · {new Date(t.createdAt).toLocaleDateString()}</p>
          </Card></button>
        ))}
        {data.tickets.length === 0 && <Card className="p-8 text-center"><p className="text-slate-500 text-[13px] font-semibold">No tickets yet.</p></Card>}
      </div>
    </div>
  );
};

export default AdminSupport;
