import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, Users, Lock, Check, ChevronRight } from 'lucide-react';
import { Screen, Button, Brand } from '../components/ui';

/* ── Illustrations ────────────────────────────────────────────────────────── */
const ParentArt = ({ accent, active }) => (
  <div className="relative flex items-center justify-center">
    <motion.div className="absolute w-24 h-24 rounded-full" style={{ background: `${accent}33`, filter: 'blur(26px)' }} animate={{ opacity: active ? [0.6, 0.95, 0.6] : 0.45 }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} />
    <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${accent}26`, border: `1px solid ${accent}55`, boxShadow: active ? `0 0 30px ${accent}55` : 'none' }}>
      <ShieldCheck size={30} style={{ color: accent }} />
    </div>
    <motion.div className="absolute -right-8 -top-3 w-9 h-9 rounded-xl bg-white/[0.06] border border-white/12 backdrop-blur-md flex items-center justify-center" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}>
      <MapPin size={15} style={{ color: accent }} />
    </motion.div>
    <div className="absolute -left-8 bottom-0 w-9 h-9 rounded-xl bg-white/[0.06] border border-white/12 backdrop-blur-md flex items-center justify-center">
      <Users size={15} className="text-slate-300" />
    </div>
  </div>
);

const ChildArt = ({ accent, active }) => (
  <div className="relative flex items-center justify-center">
    <motion.div className="absolute w-24 h-24 rounded-full" style={{ background: `${accent}33`, filter: 'blur(26px)' }} animate={{ opacity: active ? [0.6, 0.95, 0.6] : 0.45 }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} />
    <motion.div className="absolute -left-7 w-10 h-10 rounded-full border" style={{ borderColor: accent }} animate={{ scale: [1, 1.7], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }} />
    <div className="relative w-12 h-20 rounded-[13px] bg-[#0b0c14] border border-white/15 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
      <ShieldCheck size={20} style={{ color: accent }} />
    </div>
    <div className="absolute -right-9 flex items-center gap-1.5">
      <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4 }} />
      <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.25 }} />
      <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/12 flex items-center justify-center"><Lock size={14} style={{ color: accent }} /></div>
    </div>
  </div>
);

const ROLES = {
  parent: { title: 'Parent Mode', desc: 'Monitor your family, receive safety alerts, and manage protection settings.', accent: '#4f46e5', route: '/login', cta: 'Continue as Parent', Art: ParentArt },
  child: { title: 'Child Device', desc: 'Connect this device to a parent account and enable safety protection.', accent: '#06b6d4', route: '/child-setup', cta: 'Continue as Child Device', Art: ChildArt },
};

/* ── Card ─────────────────────────────────────────────────────────────────── */
const RoleCard = ({ data, selected, anyPicked, onSelect }) => (
  <motion.button
    type="button"
    onClick={onSelect}
    whileTap={{ scale: 0.98 }}
    animate={{ opacity: !anyPicked || selected ? 1 : 0.5, scale: selected ? 1 : 0.99 }}
    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    className={`ag-tap relative w-full text-left rounded-[26px] overflow-hidden border ${selected ? 'border-white/20' : 'border-white/[0.08]'}`}
    style={selected ? { boxShadow: `0 22px 60px ${data.accent}3a` } : undefined}
  >
    {/* Illustration band */}
    <div className="relative h-[110px] flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${data.accent}1f 0%, transparent 70%)` }}>
      <data.Art accent={data.accent} active={selected} />
    </div>
    {/* Body */}
    <div className="relative bg-[#0b0c14] px-5 py-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="text-[18px] font-black text-white leading-tight">{data.title}</h3>
        <p className="text-slate-400 text-[13px] font-medium mt-1.5 leading-snug max-w-[238px]">{data.desc}</p>
      </div>
      <span className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 transition-colors ${selected ? 'border-transparent' : 'border-white/20'}`} style={selected ? { background: data.accent } : undefined}>
        {selected && <Check size={14} className="text-[#030307]" strokeWidth={3.5} />}
      </span>
    </div>
  </motion.button>
);

const RoleSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preset = new URLSearchParams(location.search).get('sel'); // review-only
  const [picked, setPicked] = useState(preset === 'parent' || preset === 'child' ? preset : null);

  const role = picked ? ROLES[picked] : null;

  return (
    <Screen
      align="between"
      glow={role ? role.accent : '#2563eb'}
      footer={
        <Button disabled={!picked} iconRight={ChevronRight} onClick={() => picked && navigate(ROLES[picked].route)}>
          {role ? role.cta : 'Continue'}
        </Button>
      }
    >
      {/* Top */}
      <div className="w-full flex flex-col items-center text-center">
        <Brand variant="badge" className="mb-6" />
        <h1 className="text-[27px] font-black text-white tracking-tight leading-[1.15] max-w-[300px]">How will you use AlphaGuard?</h1>
        <p className="text-slate-500 text-[14px] font-semibold mt-2.5 max-w-[280px] leading-relaxed">Choose how you would like to set up this device.</p>
      </div>

      {/* Cards */}
      <div className="w-full flex flex-col gap-4 py-2">
        <RoleCard data={ROLES.parent} selected={picked === 'parent'} anyPicked={!!picked} onSelect={() => setPicked('parent')} />
        <RoleCard data={ROLES.child} selected={picked === 'child'} anyPicked={!!picked} onSelect={() => setPicked('child')} />
      </div>

      <div className="text-center text-[12px] text-slate-600 font-bold">You can switch modes anytime</div>
    </Screen>
  );
};

export default RoleSelection;
