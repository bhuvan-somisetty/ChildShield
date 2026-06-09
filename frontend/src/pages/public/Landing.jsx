import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Smartphone, ChevronRight, MapPin, Lock, Brain, Radio, ShieldAlert, Heart, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Screen, Button, BrandMark } from '../../components/ui';

const ROLES = {
  parent: {
    title: "I'm a Parent",
    tagline: 'Monitor & protect your family',
    icon: User,
    accent: '#4f46e5',
    glow: 'rgba(79,70,229,0.35)',
    features: [
      { icon: MapPin, label: 'Real-time family location' },
      { icon: Lock, label: 'Screen time & app limits' },
      { icon: Brain, label: 'AI parenting insights' },
    ],
    cta: 'Continue as Parent',
    route: '/login',
  },
  child: {
    title: "Set Up Child's Device",
    tagline: 'Link this phone to a parent',
    icon: Smartphone,
    accent: '#06b6d4',
    glow: 'rgba(6,182,212,0.35)',
    features: [
      { icon: Radio, label: 'Background safety sync' },
      { icon: MapPin, label: 'Protected location sharing' },
      { icon: ShieldAlert, label: 'One-tap SOS to parents' },
    ],
    cta: 'Set Up This Device',
    route: '/child-setup',
  },
};

const RoleCard = ({ roleKey, role, selected, onSelect }) => {
  const Icon = role.icon;
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={`ag-tap relative w-full text-left rounded-[26px] p-5 border overflow-hidden transition-all duration-300 ${
        selected
          ? 'border-white/20 bg-white/[0.06]'
          : 'border-white/[0.07] bg-[#0b0c14] opacity-80'
      }`}
      style={selected ? { boxShadow: `0 16px 44px ${role.glow}` } : undefined}
    >
      {/* selected accent wash */}
      {selected && (
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{ background: `radial-gradient(circle at 18% 0%, ${role.accent}26 0%, transparent 60%)` }}
        />
      )}

      <div className="relative z-10 flex items-start gap-4">
        <div
          className="flex items-center justify-center w-14 h-14 rounded-2xl flex-shrink-0 border"
          style={{ background: `${role.accent}1f`, borderColor: `${role.accent}40` }}
        >
          <Icon size={26} style={{ color: role.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[17px] font-black text-white leading-tight">{role.title}</h3>
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all ${
                selected ? 'border-transparent' : 'border-white/15'
              }`}
              style={selected ? { background: role.accent } : undefined}
            >
              {selected && <Check size={14} className="text-[#030307]" strokeWidth={3.5} />}
            </span>
          </div>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">{role.tagline}</p>

          <div className="flex flex-col gap-2 mt-4">
            {role.features.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-[12px] text-slate-300 font-semibold">
                <f.icon size={13} style={{ color: role.accent }} className="flex-shrink-0" />
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
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
      <div className="w-full flex flex-col items-center text-center pt-2">
        <BrandMark variant="badge" className="mb-7" />
        <h1 className="text-[26px] font-black text-white tracking-tight leading-tight">
          How will you use<br />AlphaGuard?
        </h1>
        <p className="text-slate-500 text-[13px] font-semibold mt-2">
          Choose a mode to get started
        </p>
      </div>

      {/* Cards */}
      <div className="w-full flex flex-col gap-4 my-2">
        <RoleCard roleKey="parent" role={ROLES.parent} selected={active === 'parent'} onSelect={() => setActive('parent')} />
        <RoleCard roleKey="child" role={ROLES.child} selected={active === 'child'} onSelect={() => setActive('child')} />
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600 font-bold pb-1">
        <Heart size={11} className="text-slate-600" />
        <span>You can switch modes anytime</span>
      </div>
    </Screen>
  );
};

export default Landing;
