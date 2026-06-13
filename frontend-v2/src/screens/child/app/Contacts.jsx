import React, { useState } from 'react';
import { Phone, Plus, Trash2, Star, X } from 'lucide-react';
import { useChildApp } from '../../../child/ChildAppContext';
import { Page, Card, Label } from './ui';

const RELATIONS = ['Parent', 'Guardian', 'Family', 'Trusted', 'Emergency'];

const Contacts = () => {
  const { contacts, addContact, removeContact } = useChildApp();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', relation: 'Parent', phone: '' });
  const save = () => { if (!form.name.trim() || !form.phone.trim()) return; addContact({ ...form, primary: false }); setForm({ name: '', relation: 'Parent', phone: '' }); setAdding(false); };

  return (
    <Page title="Emergency Contacts" sub="People who can help you" back right={<button onClick={() => setAdding((v) => !v)} aria-label="Add contact" className="ag-tap w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">{adding ? <X size={18} className="text-emerald-400" /> : <Plus size={18} className="text-emerald-400" />}</button>}>
      {adding && (
        <Card className="p-4 flex flex-col gap-2.5">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="h-12 rounded-2xl bg-[#11131d] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/40" />
          <div className="flex gap-2 overflow-x-auto ag-no-scrollbar">{RELATIONS.map((r) => <button key={r} onClick={() => setForm({ ...form, relation: r })} className={`ag-tap flex-shrink-0 h-9 px-3.5 rounded-full text-[12px] font-bold border ${form.relation === r ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`}>{r}</button>)}</div>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" placeholder="Phone number" className="h-12 rounded-2xl bg-[#11131d] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/40" />
          <button onClick={save} disabled={!form.name.trim() || !form.phone.trim()} className="ag-tap h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold text-[13px] flex items-center justify-center gap-2 disabled:opacity-40"><Plus size={16} /> Add Contact</button>
        </Card>
      )}

      <Label>Saved Contacts</Label>
      <Card className="divide-y divide-white/[0.05]">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-center gap-3.5 p-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0"><Phone size={17} className="text-emerald-400" /></div>
            <div className="flex-1 min-w-0"><p className="text-white font-bold text-[14px] truncate flex items-center gap-1.5">{c.name}{c.primary && <Star size={12} className="text-amber-400 fill-amber-400" />}</p><p className="text-slate-500 text-[12px] font-semibold truncate">{c.relation} · {c.phone}</p></div>
            <a href={`tel:${c.phone}`} aria-label={`Call ${c.name}`} className="ag-tap w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center"><Phone size={16} className="text-emerald-400" /></a>
            {!c.primary && <button onClick={() => removeContact(c.id)} aria-label="Remove" className="ag-tap w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center"><Trash2 size={15} className="text-slate-400" /></button>}
          </div>
        ))}
      </Card>
      <p className="text-slate-500 text-[12px] font-semibold text-center px-4">Your primary contact is starred and can always be called from SOS.</p>
    </Page>
  );
};

export default Contacts;
