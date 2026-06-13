import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Download, Trash2, Check, X, Clock, ShieldCheck, Inbox,
} from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { useRealtime } from '../../context/RealtimeContext';

const Page = ({ title, sub, children }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>
        <div className="flex-1 min-w-0"><h1 className="text-[22px] font-black text-white tracking-tight leading-tight">{title}</h1>{sub && <p className="text-slate-500 text-[13px] font-semibold mt-0.5">{sub}</p>}</div>
      </div>
      {children}
    </div>
  );
};
const Card = ({ children, className = '' }) => <div className={`rounded-[22px] border border-white/[0.07] bg-[#0b0c14] ${className}`}>{children}</div>;
const Label = ({ children }) => <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em] px-1">{children}</p>;

const TypeBadge = ({ type }) => type === 'install'
  ? <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 flex items-center gap-1"><Download size={10} /> INSTALL</span>
  : <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 flex items-center gap-1"><Trash2 size={10} /> DELETE</span>;

// All parent dashboard children share one approvals queue. We show the active
// child first but include the whole family so nothing is missed.
const ApprovalsCenter = () => {
  const { child, activeId } = useChild();
  const { pendingRequests, requestHistory, approveRequest, rejectRequest } = useRealtime();
  const [toast, setToast] = useState(null);

  const pending = pendingRequests();         // all children
  const history = requestHistory();
  const act = (id, decision) => {
    decision === 'approved' ? approveRequest(id) : rejectRequest(id);
    setToast(decision === 'approved' ? 'Request approved' : 'Request rejected');
    setTimeout(() => setToast(null), 1800);
  };

  const RequestCard = ({ r, decided }) => (
    <Card className="p-4">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-[16px] flex-shrink-0" style={{ background: r.color }}>{r.app[0]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap"><p className="text-white font-black text-[15px]">{r.app}</p><TypeBadge type={r.type} /></div>
          <p className="text-slate-500 text-[12px] font-semibold mt-0.5 truncate">{r.cat} · {r.childName} · {r.time}</p>
        </div>
      </div>
      {r.reason && <div className="mt-3 rounded-xl bg-black/20 border border-white/[0.06] px-3 py-2"><p className="text-slate-400 text-[12px] font-medium"><span className="text-slate-600 font-bold">Reason: </span>{r.reason}</p></div>}
      {decided ? (
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${r.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>{r.status === 'approved' ? 'APPROVED' : 'REJECTED'}</span>
          <span className="text-slate-600 text-[11.5px] font-semibold">{r.decidedAt || ''}</span>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button onClick={() => act(r.id, 'rejected')} aria-label={`Reject ${r.app}`} className="ag-tap h-11 rounded-xl bg-white/[0.05] border border-white/10 text-white font-bold text-[13px] flex items-center justify-center gap-2"><X size={16} /> Reject</button>
          <button onClick={() => act(r.id, 'approved')} aria-label={`Approve ${r.app}`} className="ag-tap h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-[13px] flex items-center justify-center gap-2"><Check size={16} /> Approve</button>
        </div>
      )}
    </Card>
  );

  return (
    <Page title="App Requests" sub={`${pending.length} pending approval${pending.length === 1 ? '' : 's'}`}>
      <Card className="flex items-start gap-2.5 p-4 border-cyan-500/15 bg-cyan-500/[0.05]">
        <ShieldCheck size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-slate-400 leading-relaxed font-medium">Children can’t install or remove apps without your approval. Every decision is logged below.</p>
      </Card>

      <Label>Pending ({pending.length})</Label>
      {pending.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-9"><Inbox size={26} className="text-slate-600" /><p className="text-slate-500 text-[13px] font-semibold">No pending requests</p></Card>
      ) : (
        <div className="flex flex-col gap-3">{pending.map((r) => <RequestCard key={r.id} r={r} />)}</div>
      )}

      {history.length > 0 && (
        <>
          <Label>History</Label>
          <div className="flex flex-col gap-3">{history.map((r) => <RequestCard key={r.id} r={r} decided />)}</div>
        </>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#11131d] border border-white/15 shadow-xl">
            <Check size={15} className="text-emerald-400" /><span className="text-white text-[13px] font-bold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
};

export default ApprovalsCenter;
