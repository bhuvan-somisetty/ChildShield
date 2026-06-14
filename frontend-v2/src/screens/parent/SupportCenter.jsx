import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, HelpCircle, Bug, Lightbulb, Mail, FileText, ShieldCheck,
  Bell, Megaphone, Star, Info, Search, Send, Paperclip, X, CheckCircle2, Clock,
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { api, clientInfo, APP_VERSION } from '../../lib/agClient';

const ISSUE_TYPES = [['bug', 'Bug'], ['login', 'Login Problem'], ['pairing', 'Pairing Issue'], ['location', 'Location Issue'], ['tasks', 'Task System Issue'], ['rewards', 'Reward System Issue'], ['notifications', 'Notification Issue'], ['ai_reports', 'AI Report Issue'], ['performance', 'Performance Issue'], ['payment', 'Payment Issue'], ['other', 'Other']];
const PRIORITIES = [['low', 'Low', '#64748b'], ['medium', 'Medium', '#3b82f6'], ['high', 'High', '#f59e0b'], ['critical', 'Critical', '#f43f5e']];
const TICKET_STATUS = { open: ['Open', '#3b82f6'], investigating: ['Investigating', '#f59e0b'], in_progress: ['In Progress', '#a855f7'], waiting_user: ['Waiting For You', '#06b6d4'], resolved: ['Resolved', '#10b981'], closed: ['Closed', '#64748b'] };
const FEATURE_STATUS = { requested: ['Requested', '#64748b'], under_review: ['Under Review', '#3b82f6'], planned: ['Planned', '#a855f7'], in_development: ['In Development', '#f59e0b'], released: ['Released', '#10b981'], rejected: ['Rejected', '#f43f5e'] };

const FAQ = [
  { c: 'Account & Login', q: 'How do I reset my password?', a: 'On the login screen tap “Forgot Password?” and follow the email verification steps.' },
  { c: 'Account & Login', q: 'Can I sign in with Google?', a: 'Yes — use “Sign in with Google” on the login or signup screen. Your account is verified by Google.' },
  { c: 'Parent Setup', q: 'What is the Security PIN for?', a: 'A 6-digit PIN protects sensitive actions like removing a child, disabling monitoring or deleting your account.' },
  { c: 'Child Pairing', q: 'How do I connect my child’s device?', a: 'Open Connect a Child Device, then scan the QR code or enter the 6-digit pairing code on the child’s phone.' },
  { c: 'Child Pairing', q: 'The pairing code says it is no longer valid.', a: 'Codes become invalid once used or regenerated. Generate a new code on the parent device and try again.' },
  { c: 'Location Tracking', q: 'Why is location not updating?', a: 'Ensure the child device has granted location permission and is online. Background location must stay enabled.' },
  { c: 'Tasks & Targets', q: 'How do task states work?', a: 'Tap a task to cycle Not Started → Completed → Failed. Every change is recorded for progress tracking.' },
  { c: 'Rewards', q: 'When does a reward unlock?', a: 'A reward linked to a target unlocks automatically when the target reaches 100%.' },
  { c: 'AI Reports', q: 'How are reports generated?', a: 'Reports are computed from your child’s real task, target and streak data — daily, weekly or monthly.' },
  { c: 'Notifications', q: 'I’m not getting notifications.', a: 'Enable notification permission during setup, or from Settings → Notifications.' },
  { c: 'Privacy & Security', q: 'Is my family’s data secure?', a: 'Data is encrypted in transit (TLS) and at rest. Live monitoring media is end-to-end encrypted and never stored.' },
];

const Header = ({ title, onBack }) => (
  <div className="flex items-center gap-3 mb-5">
    <button onClick={onBack} aria-label="Back" className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>
    <h1 className="text-[19px] font-black text-white tracking-tight">{title}</h1>
  </div>
);

const Row = ({ icon: Icon, color, label, sub, onClick }) => (
  <button onClick={onClick} className="ag-tap w-full flex items-center gap-3.5 p-3.5">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}1f` }}><Icon size={17} style={{ color }} /></div>
    <div className="flex-1 text-left min-w-0"><p className="text-white font-bold text-[14px]">{label}</p>{sub && <p className="text-slate-500 text-[12px] font-semibold truncate">{sub}</p>}</div>
    <ChevronRight size={17} className="text-slate-600" />
  </button>
);

const Pill = ({ map, value }) => { const m = map[value] || ['—', '#64748b']; return <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: `${m[1]}1a`, color: m[1] }}>{m[0]}</span>; };

/* ── Help Center (searchable FAQ) ──────────────────────────────────────── */
const HelpCenter = ({ onBack }) => {
  const [q, setQ] = useState('');
  const list = FAQ.filter((f) => !q || (f.q + f.a + f.c).toLowerCase().includes(q.toLowerCase()));
  const cats = [...new Set(list.map((f) => f.c))];
  return (
    <div>
      <Header title="Help Center" onBack={onBack} />
      <div className="relative mb-4"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help…" className="w-full h-11 rounded-2xl bg-[#0b0c14] border border-white/10 pl-10 pr-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/40" /></div>
      {cats.map((c) => (
        <div key={c} className="mb-4">
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-wide mb-2 px-1">{c}</p>
          <Card className="divide-y divide-white/[0.05]">{list.filter((f) => f.c === c).map((f) => <FaqItem key={f.q} f={f} />)}</Card>
        </div>
      ))}
      {list.length === 0 && <p className="text-slate-500 text-[13px] font-semibold text-center py-8">No results for “{q}”.</p>}
    </div>
  );
};
const FaqItem = ({ f }) => { const [open, setOpen] = useState(false); return (<button onClick={() => setOpen((v) => !v)} className="ag-tap w-full text-left p-3.5"><p className="text-white font-bold text-[13.5px]">{f.q}</p>{open && <p className="text-slate-400 text-[13px] font-medium mt-2 leading-relaxed">{f.a}</p>}</button>); };

/* ── Report an Issue ───────────────────────────────────────────────────── */
const ReportIssue = ({ onBack, onDone }) => {
  const [f, setF] = useState({ issueType: 'bug', title: '', description: '', expected: '', actual: '', steps: '', priority: 'medium' });
  const [attachment, setAttachment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const info = clientInfo();

  const pickFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 700 * 1024) { setError('Screenshot must be under 700 KB.'); return; }
    const reader = new FileReader(); reader.onload = () => setAttachment({ name: file.name, dataUrl: reader.result }); reader.readAsDataURL(file);
  };
  const submit = async () => {
    if (!f.title.trim()) { setError('Please add a title.'); return; }
    setBusy(true); setError('');
    try { const { ticket } = await api.createTicket({ ...f, ...info, attachment }); onDone(ticket); }
    catch (e) { setError(e.message || 'Could not submit. Try again.'); } finally { setBusy(false); }
  };
  return (
    <div>
      <Header title="Report an Issue" onBack={onBack} />
      <div className="flex flex-col gap-3.5">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 px-1">Issue type</p>
          <select value={f.issueType} onChange={(e) => setF({ ...f, issueType: e.target.value })} className="w-full h-12 rounded-2xl bg-[#0b0c14] border border-white/10 px-3 text-[14px] text-white outline-none">{ISSUE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </div>
        <Input label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Short summary" />
        <Field label="Description" value={f.description} onChange={(v) => setF({ ...f, description: v })} placeholder="What happened?" />
        <Field label="Expected behavior" value={f.expected} onChange={(v) => setF({ ...f, expected: v })} placeholder="What should happen" />
        <Field label="Actual behavior" value={f.actual} onChange={(v) => setF({ ...f, actual: v })} placeholder="What actually happened" />
        <Field label="Steps to reproduce" value={f.steps} onChange={(v) => setF({ ...f, steps: v })} placeholder="1. … 2. …" />
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 px-1">Priority</p>
          <div className="flex gap-2">{PRIORITIES.map(([v, l, c]) => <button key={v} onClick={() => setF({ ...f, priority: v })} className={`ag-tap flex-1 h-10 rounded-xl text-[12px] font-bold border ${f.priority === v ? '' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`} style={f.priority === v ? { background: `${c}1f`, borderColor: `${c}66`, color: c } : undefined}>{l}</button>)}</div>
        </div>
        <button onClick={() => fileRef.current?.click()} className="ag-tap flex items-center gap-2 h-11 px-4 rounded-2xl bg-white/[0.04] border border-white/10 text-slate-300 text-[13px] font-bold"><Paperclip size={15} /> {attachment ? attachment.name : 'Attach screenshot (optional)'}</button>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={pickFile} className="hidden" />
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 text-[11.5px] text-slate-500 font-semibold leading-relaxed">Auto-attached · {info.device} · {info.browser} · v{info.appVersion}</div>
        {error && <p className="text-rose-400 text-[12.5px] font-semibold px-1">{error}</p>}
        <Button loading={busy} disabled={!f.title.trim()} iconRight={Send} onClick={submit}>Submit Report</Button>
      </div>
    </div>
  );
};
const Field = ({ label, value, onChange, placeholder }) => (
  <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 px-1">{label}</p><textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} className="w-full rounded-2xl bg-[#0b0c14] border border-white/10 px-4 py-3 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/40 resize-none" /></div>
);

/* ── My Tickets (list + detail thread) ─────────────────────────────────── */
const MyTickets = ({ onBack, openTicket }) => {
  const [tickets, setTickets] = useState(null);
  useEffect(() => { api.listTickets().then((r) => setTickets(r.tickets)).catch(() => setTickets([])); }, []);
  return (
    <div>
      <Header title="My Support Tickets" onBack={onBack} />
      {tickets === null ? <p className="text-slate-500 text-[13px] font-semibold text-center py-8">Loading…</p>
        : tickets.length === 0 ? <Card className="p-8 text-center"><p className="text-white font-bold text-[14px]">No tickets yet</p><p className="text-slate-500 text-[12.5px] font-semibold mt-1">Report an issue and track it here.</p></Card>
        : <div className="flex flex-col gap-2.5">{tickets.map((t) => (
          <button key={t.id} onClick={() => openTicket(t.id)} className="ag-tap text-left"><Card className="p-3.5">
            <div className="flex items-center justify-between"><span className="text-slate-500 text-[12px] font-black">#{t.ticketNumber}</span><Pill map={TICKET_STATUS} value={t.status} /></div>
            <p className="text-white font-bold text-[14.5px] mt-1.5">{t.title}</p>
            <p className="text-slate-500 text-[11.5px] font-semibold mt-1 inline-flex items-center gap-1"><Clock size={11} /> Updated {new Date(t.updatedAt).toLocaleDateString()}</p>
          </Card></button>
        ))}</div>}
    </div>
  );
};

const TicketDetail = ({ id, onBack }) => {
  const [data, setData] = useState(null);
  const [body, setBody] = useState('');
  const load = useCallback(() => api.getTicket(id).then(setData).catch(() => {}), [id]);
  useEffect(() => { load(); }, [load]);
  const send = async () => { if (!body.trim()) return; const r = await api.commentTicket(id, body.trim()); setData(r); setBody(''); };
  const close = async () => { await api.closeTicket(id); load(); };
  if (!data) return <div><Header title="Ticket" onBack={onBack} /><p className="text-slate-500 text-[13px] font-semibold text-center py-8">Loading…</p></div>;
  const { ticket, comments } = data;
  return (
    <div>
      <Header title={`Ticket #${ticket.ticketNumber}`} onBack={onBack} />
      <Card className="p-4 mb-3">
        <div className="flex items-center justify-between"><p className="text-white font-black text-[15px]">{ticket.title}</p><Pill map={TICKET_STATUS} value={ticket.status} /></div>
        {ticket.description && <p className="text-slate-400 text-[13px] font-medium mt-2">{ticket.description}</p>}
        <p className="text-slate-600 text-[11px] font-bold mt-2">{ticket.issueType} · {ticket.priority} priority</p>
      </Card>
      <div className="flex flex-col gap-2 mb-3">
        {comments.map((c) => (
          <div key={c.id} className={`p-3 rounded-2xl border max-w-[88%] ${c.authorRole === 'admin' ? 'self-start bg-cyan-500/[0.06] border-cyan-500/15' : 'self-end bg-indigo-500/[0.06] border-indigo-500/15'}`}>
            <p className="text-[10px] font-black uppercase tracking-wide mb-0.5" style={{ color: c.authorRole === 'admin' ? '#06b6d4' : '#818cf8' }}>{c.authorRole === 'admin' ? 'Support' : 'You'}</p>
            <p className="text-slate-200 text-[13px] font-medium">{c.body}</p>
          </div>
        ))}
        {comments.length === 0 && <p className="text-slate-500 text-[12.5px] font-semibold text-center py-2">No replies yet. Our team will respond soon.</p>}
      </div>
      {ticket.status !== 'closed' && (
        <>
          <div className="flex items-center gap-2"><input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a comment…" className="flex-1 h-11 rounded-2xl bg-[#0b0c14] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/40" /><button onClick={send} className="ag-tap w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"><Send size={17} className="text-white" /></button></div>
          <button onClick={close} className="ag-tap mt-3 w-full h-10 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 text-[12.5px] font-bold">Close this ticket</button>
        </>
      )}
    </div>
  );
};

/* ── Feature request ───────────────────────────────────────────────────── */
const FeatureRequests = ({ onBack }) => {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ title: '', description: '', category: 'general', useCase: '', priority: 'medium' });
  const [busy, setBusy] = useState(false);
  const load = () => api.listFeatures().then((r) => setList(r.features)).catch(() => {});
  useEffect(() => { load(); }, []);
  const submit = async () => { if (!f.title.trim()) return; setBusy(true); try { await api.createFeature(f); setF({ title: '', description: '', category: 'general', useCase: '', priority: 'medium' }); load(); } finally { setBusy(false); } };
  return (
    <div>
      <Header title="Request a Feature" onBack={onBack} />
      <div className="flex flex-col gap-3 mb-5">
        <Input label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="What would you like?" />
        <Field label="Description" value={f.description} onChange={(v) => setF({ ...f, description: v })} placeholder="Describe the feature" />
        <Field label="Use case" value={f.useCase} onChange={(v) => setF({ ...f, useCase: v })} placeholder="When would you use it?" />
        <Button loading={busy} disabled={!f.title.trim()} iconRight={Send} onClick={submit}>Submit Request</Button>
      </div>
      {list.length > 0 && <p className="text-slate-500 text-[11px] font-black uppercase tracking-wide mb-2 px-1">Your requests</p>}
      <div className="flex flex-col gap-2">{list.map((x) => (<Card key={x.id} className="p-3.5"><div className="flex items-center justify-between"><p className="text-white font-bold text-[14px]">{x.title}</p><Pill map={FEATURE_STATUS} value={x.status} /></div></Card>))}</div>
    </div>
  );
};

/* ── What's New / Announcements / Contact / Rate / About ───────────────── */
const WhatsNew = ({ onBack }) => {
  const [items, setItems] = useState([]);
  useEffect(() => { api.changelog().then((r) => setItems(r.changelog)).catch(() => {}); }, []);
  return (<div><Header title="What’s New" onBack={onBack} />{items.length === 0 ? <p className="text-slate-500 text-[13px] font-semibold text-center py-8">No release notes yet.</p> : items.map((c) => (
    <Card key={c.id} className="p-4 mb-3"><div className="flex items-center justify-between mb-2"><p className="text-white font-black text-[16px]">Version {c.version}</p><span className="text-slate-500 text-[11px] font-bold">{c.date}</span></div>
      {c.added?.length > 0 && <Section title="Added" color="#10b981" items={c.added} />}
      {c.fixed?.length > 0 && <Section title="Fixed" color="#3b82f6" items={c.fixed} />}
      {c.improved?.length > 0 && <Section title="Improved" color="#f59e0b" items={c.improved} />}
    </Card>))}</div>);
};
const Section = ({ title, color, items }) => (<div className="mt-2"><p className="text-[11px] font-black uppercase tracking-wide mb-1" style={{ color }}>{title}</p>{items.map((i, k) => <p key={k} className="text-slate-300 text-[13px] font-medium">✓ {i}</p>)}</div>);

const Announcements = ({ onBack }) => {
  const [items, setItems] = useState([]);
  useEffect(() => { api.announcements().then((r) => setItems(r.announcements)).catch(() => {}); }, []);
  return (<div><Header title="Announcements" onBack={onBack} />{items.length === 0 ? <p className="text-slate-500 text-[13px] font-semibold text-center py-8">No announcements.</p> : items.map((a) => (
    <Card key={a.id} className="p-4 mb-3" style={{ borderColor: a.priority === 'high' ? 'rgba(245,158,11,0.3)' : undefined }}><p className="text-white font-black text-[15px]">{a.title}</p><p className="text-slate-400 text-[13px] font-medium mt-1.5 leading-relaxed">{a.description}</p><p className="text-slate-600 text-[11px] font-bold mt-2">{new Date(a.at).toLocaleDateString()}</p></Card>))}</div>);
};

const Contact = ({ onBack }) => (
  <div><Header title="Contact Support" onBack={onBack} />
    <Card className="p-5 flex flex-col gap-3">
      <a href="mailto:support@alphaguardai.com" className="flex items-center gap-3"><Mail size={18} className="text-cyan-400" /><span className="text-white font-bold text-[14px]">support@alphaguardai.com</span></a>
      <a href="mailto:alphaguardai@gmail.com" className="flex items-center gap-3"><Mail size={18} className="text-cyan-400" /><span className="text-white font-bold text-[14px]">alphaguardai@gmail.com</span></a>
    </Card>
    <Card className="p-5 mt-3 flex flex-col gap-2.5">
      <Info2 label="Support hours" value="Mon–Sat, 9 AM – 7 PM IST" />
      <Info2 label="Typical response" value="Within 24 hours" />
      <Info2 label="Emergency / child safety" value="Use in-app SOS for urgent safety issues" />
    </Card>
  </div>
);
const Info2 = ({ label, value }) => (<div><p className="text-slate-500 text-[11px] font-black uppercase tracking-wide">{label}</p><p className="text-white text-[14px] font-bold">{value}</p></div>);

const Rate = ({ onBack }) => {
  const [stars, setStars] = useState(0); const [fb, setFb] = useState(''); const [done, setDone] = useState(false);
  const submit = async () => { if (!stars) return; await api.rateApp(stars, fb); setDone(true); };
  if (done) return <div><Header title="Rate AlphaGuard" onBack={onBack} /><Card className="p-8 flex flex-col items-center gap-2 text-center"><CheckCircle2 size={36} className="text-emerald-400" /><p className="text-white font-black text-[16px]">Thank you!</p><p className="text-slate-500 text-[13px] font-semibold">Your feedback helps us improve.</p></Card></div>;
  return (<div><Header title="Rate AlphaGuard" onBack={onBack} />
    <Card className="p-6 flex flex-col items-center gap-4">
      <p className="text-white font-bold text-[15px]">How is your experience?</p>
      <div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setStars(n)} className="ag-tap"><Star size={34} className={n <= stars ? 'text-amber-400' : 'text-slate-700'} fill={n <= stars ? '#f59e0b' : 'none'} /></button>)}</div>
      <textarea value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Tell us more (optional)" rows={3} className="w-full rounded-2xl bg-[#0b0c14] border border-white/10 px-4 py-3 text-[14px] text-white placeholder:text-slate-600 outline-none resize-none" />
      <Button disabled={!stars} onClick={submit}>Submit Rating</Button>
    </Card>
  </div>);
};

const About = ({ onBack, navigate }) => (
  <div><Header title="About AlphaGuard" onBack={onBack} />
    <Card className="p-6 flex flex-col items-center text-center gap-2">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600/30 to-cyan-500/15 border border-blue-400/30 flex items-center justify-center mb-1"><ShieldCheck size={30} className="text-cyan-300" /></div>
      <p className="text-white font-black text-[18px]">AlphaGuard AI V2</p>
      <p className="text-slate-500 text-[13px] font-semibold">Version {APP_VERSION} · Build {APP_VERSION.replace(/\./g, '')}</p>
    </Card>
    <Card className="divide-y divide-white/[0.05] mt-3">
      <Row icon={FileText} color="#64748b" label="Privacy Policy" onClick={() => navigate('/app/settings/legal/privacy')} />
      <Row icon={FileText} color="#64748b" label="Terms of Service" onClick={() => navigate('/app/settings/legal/terms')} />
      <Row icon={ShieldCheck} color="#10b981" label="Child Safety Policy" onClick={() => navigate('/app/settings/legal/child-safety')} />
    </Card>
    <p className="text-center text-slate-600 text-[12px] font-semibold mt-6">Made with ❤️ by AlphaGuard AI</p>
  </div>
);

/* ── Hub ───────────────────────────────────────────────────────────────── */
const SupportCenter = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('hub');
  const [ticketId, setTicketId] = useState(null);
  const [flash, setFlash] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const hub = () => setView('hub');

  useEffect(() => { api.me().then((r) => setIsAdmin(!!r.admin)).catch(() => {}); }, []);

  if (view === 'help') return <HelpCenter onBack={hub} />;
  if (view === 'report') return <ReportIssue onBack={hub} onDone={(t) => { setFlash(t); setView('hub'); }} />;
  if (view === 'tickets') return <MyTickets onBack={hub} openTicket={(id) => { setTicketId(id); setView('ticket'); }} />;
  if (view === 'ticket') return <TicketDetail id={ticketId} onBack={() => setView('tickets')} />;
  if (view === 'feature') return <FeatureRequests onBack={hub} />;
  if (view === 'whatsnew') return <WhatsNew onBack={hub} />;
  if (view === 'announcements') return <Announcements onBack={hub} />;
  if (view === 'contact') return <Contact onBack={hub} />;
  if (view === 'rate') return <Rate onBack={hub} />;
  if (view === 'about') return <About onBack={hub} navigate={navigate} />;

  return (
    <div className="flex flex-col gap-4">
      <Header title="Help &amp; Support" onBack={() => navigate('/app/settings')} />
      {flash && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/25 flex items-center gap-2.5">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-[13px] font-semibold">Ticket #{flash.ticketNumber} submitted. Track it in My Tickets.</p>
        </motion.div>
      )}
      <Card className="divide-y divide-white/[0.05]">
        <Row icon={HelpCircle} color="#06b6d4" label="Help Center" sub="Searchable FAQ" onClick={() => setView('help')} />
        <Row icon={Bug} color="#f43f5e" label="Report an Issue" sub="Found a bug? Tell us" onClick={() => setView('report')} />
        <Row icon={Clock} color="#3b82f6" label="My Support Tickets" sub="Track your reports" onClick={() => setView('tickets')} />
        <Row icon={Lightbulb} color="#f59e0b" label="Request a Feature" onClick={() => setView('feature')} />
        <Row icon={Mail} color="#10b981" label="Contact Support" onClick={() => setView('contact')} />
      </Card>
      <Card className="divide-y divide-white/[0.05]">
        <Row icon={Bell} color="#a855f7" label="What’s New" onClick={() => setView('whatsnew')} />
        <Row icon={Megaphone} color="#6366f1" label="Announcements" onClick={() => setView('announcements')} />
        <Row icon={Star} color="#f59e0b" label="Rate AlphaGuard" onClick={() => setView('rate')} />
        <Row icon={Info} color="#64748b" label="About AlphaGuard" onClick={() => setView('about')} />
      </Card>
      <Card className="divide-y divide-white/[0.05]">
        <Row icon={FileText} color="#64748b" label="Privacy Policy" onClick={() => navigate('/app/settings/legal/privacy')} />
        <Row icon={FileText} color="#64748b" label="Terms of Service" onClick={() => navigate('/app/settings/legal/terms')} />
        <Row icon={ShieldCheck} color="#10b981" label="Child Safety Policy" onClick={() => navigate('/app/settings/legal/child-safety')} />
      </Card>
      {isAdmin && (
        <Card className="divide-y divide-white/[0.05]">
          <Row icon={ShieldCheck} color="#f43f5e" label="Admin Support Dashboard" sub="Platform administrators" onClick={() => navigate('/app/admin/support')} />
        </Card>
      )}
    </div>
  );
};

export default SupportCenter;
