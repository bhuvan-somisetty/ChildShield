import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Smartphone, ChevronRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Screen, Button, BrandMark } from '../../components/ui';

const ROLES = {
  parent: {
    title: 'Parent Mode',
    tagline: 'Monitor and protect your family',
    icon: User,
    accent: '#4f46e5',
    glow: 'rgba(79,70,229,0.35)',
    cta: 'Continue as Parent',
    route: '/login',
  },
  child: {
    title: 'Child Device',
    tagline: 'Connect this device to a parent',
    icon: Smartphone,
    accent: '#06b6d4',
    glow: 'rgba(6,182,212,0.35)',
    cta: 'Set Up This Device',
    route: '/child-setup',
  },
};

const RoleCard = ({ role, selected, onSelect }) => {
  const Icon = role.icon;
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.985 }}
      animate={{ scale: selected ? 1 : 0.985, opacity: selected ? 1 : 0.68 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className={`ag-tap relative w-full text-left rounded-[24px] p-4 border overflow-hidden flex items-center gap-4 ${
        selected ? 'border-white/20 bg-white/[0.06]' : 'border-white/[0.07] bg-[#0b0c14]'
      }`}
      style={selected ? { boxShadow: `0 16px 44px ${role.glow}` } : undefined}
    >
      {/* selected accent wash */}
      {selected && (
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{ background: `radial-gradient(circle at 16% 50%, ${role.accent}28 0%, transparent 58%)` }}
        />
      )}

      <div
        className="relative z-10 flex items-center justify-center w-12 h-12 rounded-2xl border flex-shrink-0"
        style={{ background: `${role.accent}1f`, borderColor: `${role.accent}44` }}
      >
        <Icon size={24} style={{ color: role.accent }} />
      </div>

      <div className="relative z-10 flex-1 min-w-0">
        <h3 className="text-[17px] font-black text-white leading-tight">{role.title}</h3>
        <p className="text-slate-400 text-[13px] font-semibold mt-1">{role.tagline}</p>
      </div>

      <span
        className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all ${
          selected ? 'border-transparent' : 'border-white/15'
        }`}
        style={selected ? { background: role.accent } : undefined}
      >
        {selected && <Check size={14} className="text-[#030307]" strokeWidth={3.5} />}
      </span>
    </motion.button>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState('parent');
  const role = ROLES[active];

  const handleContinue = () => {
    localStorage.removeItem('cs_token'); // clear stale tokens before role entry
    navigate(role.route);
  };

  return (
    <Screen
      ambient="brand"
      glowColor={`radial-gradient(circle, ${role.accent} 0%, transparent 60%)`}
      align="between"
      scroll={false}
      footer={
        <Button onClick={handleContinue} iconRight={ChevronRight}>
          {role.cta}
        </Button>
      }
    >
      {/* Header */}
      <div className="w-full flex flex-col items-center text-center">
        <BrandMark variant="badge" className="mb-7" />
        <h1 className="text-[28px] font-black text-white tracking-tight leading-[1.15]">
          How will you<br />use AlphaGuard?
        </h1>
        <p className="text-slate-500 text-[14px] font-semibold mt-2.5">
          Choose a mode to get started
        </p>
      </div>

      {/* Cards */}
      <div className="w-full flex flex-col gap-3.5">
        <RoleCard role={ROLES.parent} selected={active === 'parent'} onSelect={() => setActive('parent')} />
        <RoleCard role={ROLES.child} selected={active === 'child'} onSelect={() => setActive('child')} />
      </div>

      <div className="flex items-center justify-center text-[12px] text-slate-600 font-bold">
        <span>You can switch modes anytime</span>
      </div>
    </Screen>
  );
};

export default Landing;
