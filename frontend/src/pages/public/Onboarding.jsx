import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, Bell, ShieldAlert, Lock,
  ChevronRight, ChevronLeft, Navigation, Hourglass, Radio, Siren, FileCheck2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, Button, ProgressDots } from '../../components/ui';

/* ── Slide graphics (premium, lightweight, subtle motion) ──────────────────── */
const FrameCard = ({ color, children }) => (
  <div className="relative w-56 h-52 flex items-center justify-center">
    <div
      className="absolute inset-0 rounded-[28px] border border-white/10 overflow-hidden shadow-[0_24px_56px_rgba(0,0,0,0.5)]"
      style={{ background: `linear-gradient(135deg, ${color}22, rgba(8,9,18,0.95))` }}
    >
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 35%, ${color}1f 0%, transparent 65%)` }}
      />
    </div>
    <div className="relative z-10 flex items-center justify-center w-full h-full">{children}</div>
  </div>
);

const Pill = ({ color, icon: Icon, label, className = '', delay = 0.25 }) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className={`absolute flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg border border-white/10 ${className}`}
    style={{ background: color, color: '#030307' }}
  >
    {Icon && <Icon size={11} />}
    <span>{label}</span>
  </motion.div>
);

const SLIDES = [
  {
    id: 'location',
    color: '#06b6d4',
    eyebrow: 'Live Protection',
    title: 'Real-Time Location Tracking',
    body: 'See where your child is the moment it matters — precise, always-on location with a clean live map and battery-smart updates.',
    graphic: (color) => (
      <FrameCard color={color}>
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
            <Navigation size={30} className="text-cyan-300" fill="currentColor" />
          </div>
        </motion.div>
        <Pill color="#22d3ee" icon={MapPin} label="Live now" className="top-3 right-3" />
      </FrameCard>
    ),
  },
  {
    id: 'screentime',
    color: '#8b5cf6',
    eyebrow: 'Healthy Habits',
    title: 'Smart Screen Time Control',
    body: 'Set daily limits, schedule bedtime, and pause the device instantly. Balanced screen time without the daily arguments.',
    graphic: (color) => (
      <FrameCard color={color}>
        <motion.div
          animate={{ rotate: [0, 6, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-3xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center"
        >
          <Hourglass size={28} className="text-purple-300" />
        </motion.div>
        <Pill color="#a78bfa" icon={Clock} label="2h daily limit" className="bottom-4 left-3" />
      </FrameCard>
    ),
  },
  {
    id: 'safezones',
    color: '#10b981',
    eyebrow: 'Geofencing',
    title: 'Safe Zones & Instant Alerts',
    body: 'Draw safe areas like home and school. Get an instant alert the moment your child arrives or leaves — automatically.',
    graphic: (color) => (
      <FrameCard color={color}>
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeOut' }}
            className="absolute w-24 h-24 rounded-full border-2 border-emerald-400/40"
          />
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
            <Radio size={28} className="text-emerald-300" />
          </div>
        </div>
        <Pill color="#34d399" icon={Bell} label="Entered school" className="top-3 left-3" />
      </FrameCard>
    ),
  },
  {
    id: 'sos',
    color: '#f59e0b',
    eyebrow: 'Emergency Ready',
    title: 'Emergency SOS Protection',
    body: 'One tap broadcasts a distress alert with live location and audio. Help reaches your child faster when seconds count.',
    graphic: (color) => (
      <FrameCard color={color}>
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.35)]"
        >
          <Siren size={30} className="text-amber-300" />
        </motion.div>
        <Pill color="#fbbf24" icon={ShieldAlert} label="SOS broadcasting" className="bottom-4 right-3" />
      </FrameCard>
    ),
  },
  {
    id: 'privacy',
    color: '#3b82f6',
    eyebrow: 'Trust & Transparency',
    title: 'Privacy, Safety & Terms',
    body: 'Your family’s data is encrypted and never sold. Monitoring is always visible to your child — safety with respect, by design.',
    isConsent: true,
    terms:
      'By continuing you confirm you have read and agree to the AlphaGuard AI Terms of Service and Privacy Policy. You authorize AlphaGuard AI to process location, device, and safety telemetry to deliver parental-safety features in line with applicable privacy regulations.',
    graphic: (color) => (
      <FrameCard color={color}>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-3xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center"
        >
          <FileCheck2 size={28} className="text-blue-300" />
        </motion.div>
        <Pill color="#60a5fa" icon={Lock} label="End-to-end encrypted" className="top-3 right-3" />
      </FrameCard>
    ),
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const go = (next) => {
    if (next < 0 || next >= SLIDES.length) return;
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const handleNext = () => {
    if (isLast) navigate('/role-selection', { replace: true });
    else go(step + 1);
  };

  const onDragEnd = (_, info) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(step + 1);
    else if (info.offset.x > 60 || info.velocity.x > 400) go(step - 1);
  };

  return (
    <Screen
      ambient="brand"
      glowColor={`radial-gradient(circle, ${slide.color} 0%, transparent 60%)`}
      align="between"
      scroll={false}
      footer={
        <Button onClick={handleNext} iconRight={ChevronRight}>
          {isLast ? 'Agree & Continue' : 'Continue'}
        </Button>
      }
    >
      {/* Top bar: back + skip */}
      <div className="w-full flex items-center justify-between min-h-[28px]">
        {step > 0 ? (
          <button
            onClick={() => go(step - 1)}
            className="ag-tap flex items-center gap-1 text-slate-400 hover:text-white text-xs font-bold"
          >
            <ChevronLeft size={15} /> Back
          </button>
        ) : (
          <span />
        )}
        {!isLast && (
          <button
            onClick={() => go(SLIDES.length - 1)}
            className="ag-tap text-slate-400 hover:text-white text-xs font-bold"
          >
            Skip
          </button>
        )}
      </div>

      {/* Swipeable carousel */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide.id}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={onDragEnd}
            className="w-full flex flex-col items-center text-center cursor-grab active:cursor-grabbing"
          >
            <div className="mb-9">{slide.graphic(slide.color)}</div>

            <span
              className="text-[11px] font-black uppercase tracking-[0.28em] mb-3"
              style={{ color: slide.color }}
            >
              {slide.eyebrow}
            </span>
            <h2 className="text-[26px] font-black text-white tracking-tight leading-[1.15] mb-3 px-2">
              {slide.title}
            </h2>
            <p className="text-slate-400 text-[14px] leading-relaxed max-w-[330px] px-2">
              {slide.body}
            </p>

            {slide.isConsent && (
              <div className="mt-5 mx-2 p-4 bg-black/40 border border-white/[0.06] rounded-2xl text-[11px] text-slate-500 leading-relaxed text-left max-h-[96px] overflow-y-auto ag-no-scrollbar">
                {slide.terms}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Step indicator */}
      <div className="w-full flex justify-center py-5">
        <ProgressDots count={SLIDES.length} active={step} color={slide.color} />
      </div>
    </Screen>
  );
};

export default Onboarding;
