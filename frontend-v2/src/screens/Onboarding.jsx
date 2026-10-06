import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, X, ShieldCheck, UserPlus, KeyRound, Link2, SlidersHorizontal,
  ListChecks, Sparkles, BarChart3, MapPin, Gift, Target, MessageCircle, Trophy, Hash,
  Lock, Eye, Ban, FileText, Users, Smartphone, Flame,
} from 'lucide-react';
import { Screen, Button, Progress } from '../components/ui';
import { useStepHistory } from '../lib/useStepHistory';
import { markOnboarded } from '../lib/lifecycle';
import { AiArt, DeviceArt, PrivacyArt } from './OnboardingArt';
import { EFFECTIVE, legalDoc } from '../data/legal';

/* ── Presentational helpers (AlphaGuard design language) ───────────────────── */
const IconTile = ({ icon: Icon, accent, size = 48 }) => (
  <div className="rounded-2xl flex items-center justify-center flex-shrink-0" style={{ width: size, height: size, background: `${accent}1a`, border: `1px solid ${accent}40` }}>
    <Icon size={size * 0.45} style={{ color: accent }} />
  </div>
);

const StepRow = ({ n, icon, title, sub, accent }) => (
  <div className="flex items-center gap-3.5 p-3.5 rounded-[20px] border border-white/[0.07] bg-[#0b0c14]">
    <div className="relative">
      <IconTile icon={icon} accent={accent} size={42} />
      <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-white text-[#06070f] text-[10px] font-black flex items-center justify-center">{n}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white font-bold text-[14px] leading-tight">{title}</p>
      {sub && <p className="text-slate-500 text-[12px] font-semibold mt-0.5">{sub}</p>}
    </div>
  </div>
);

const FeatureTile = ({ icon: Icon, label, accent }) => (
  <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-white/[0.07] bg-[#0b0c14]">
    <IconTile icon={Icon} accent={accent} size={34} />
    <span className="text-white font-bold text-[12.5px] leading-tight">{label}</span>
  </div>
);

const CommitRow = ({ icon: Icon, title, sub, accent }) => (
  <div className="flex items-start gap-3 p-3.5 rounded-[20px] border border-white/[0.07] bg-[#0b0c14]">
    <IconTile icon={Icon} accent={accent} size={38} />
    <div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px]">{title}</p><p className="text-slate-500 text-[12px] font-semibold mt-0.5 leading-snug">{sub}</p></div>
  </div>
);

const Hero = ({ Art, icon: Icon, accent }) => (
  <div className="w-full flex items-center justify-center mb-6">
    {Art ? <Art accent={accent} /> : (
      <div className="relative">
        <div className="absolute -inset-4 rounded-[32px] blur-2xl" style={{ background: `${accent}33` }} />
        <div className="relative w-20 h-20 rounded-[26px] flex items-center justify-center" style={{ background: `${accent}1f`, border: `1px solid ${accent}55` }}>
          <Icon size={38} style={{ color: accent }} />
        </div>
      </div>
    )}
  </div>
);

const SectionHead = ({ title, sub }) => (
  <div className="text-center mb-5">
    <h1 className="text-[24px] font-black text-white tracking-tight leading-tight">{title}</h1>
    <p className="text-slate-400 text-[14px] font-medium mt-2 max-w-[330px] mx-auto leading-relaxed">{sub}</p>
  </div>
);

/* ── Sections (Welcome and Parent/Child Selection are separate routes) ─────── */
const SECTIONS = [
  {
    id: 'how', accent: '#06b6d4', title: 'How AlphaGuard Works',
    sub: 'AlphaGuard links a parent device and a child device. Parents guide and protect; children build healthy habits — together, and always transparently.',
    content: (a) => (
      <>
        <Hero Art={AiArt} accent={a} />
        <SectionHead title="How AlphaGuard Works" sub="A shared, transparent space for families — safety for parents, growth for children." />
        <div className="flex flex-col gap-2.5">
          <StepRow n={1} icon={Link2} title="Pair the two devices" sub="A secure 6-digit code connects parent and child." accent={a} />
          <StepRow n={2} icon={ListChecks} title="Set tasks, goals & rewards" sub="Everyday routines that build great habits." accent="#3b82f6" />
          <StepRow n={3} icon={ShieldCheck} title="Stay safe & informed" sub="Location, safe zones, SOS and AI insights." accent="#10b981" />
        </div>
      </>
    ),
  },
  {
    id: 'parentGuide', accent: '#3b82f6', title: 'Parent Guide',
    sub: 'Getting started as a parent takes just a few minutes.',
    content: (a) => (
      <>
        <Hero icon={Users} accent={a} />
        <SectionHead title="Parent Guide" sub="Set up your family's safety in a few simple steps." />
        <div className="flex flex-col gap-2.5">
          <StepRow n={1} icon={UserPlus} title="Create your account" sub="Sign up with email or Google." accent={a} />
          <StepRow n={2} icon={KeyRound} title="Set a Security PIN" sub="Protects sensitive parental actions." accent="#06b6d4" />
          <StepRow n={3} icon={Link2} title="Connect your child's device" sub="Share the pairing code with their app." accent="#10b981" />
          <StepRow n={4} icon={SlidersHorizontal} title="Configure family safety" sub="Permissions, safe zones and alerts." accent="#a855f7" />
          <StepRow n={5} icon={ListChecks} title="Monitor tasks & goals" sub="Assign, review and approve progress." accent="#f59e0b" />
          <StepRow n={6} icon={BarChart3} title="Receive AI reports" sub="Completion, approval and consistency." accent="#ec4899" />
          <StepRow n={7} icon={Sparkles} title="View family insights" sub="Understand habits and what to focus on." accent="#06b6d4" />
        </div>
      </>
    ),
  },
  {
    id: 'parentFeatures', accent: '#6366f1', title: 'Parent Features',
    sub: 'Everything you need to guide and protect — in one place.',
    content: (a) => (
      <>
        <Hero icon={ShieldCheck} accent={a} />
        <SectionHead title="What Parents Can Do" sub="Powerful, transparent tools for everyday family safety." />
        <div className="grid grid-cols-2 gap-2.5">
          <FeatureTile icon={MapPin} label="Family Location" accent="#06b6d4" />
          <FeatureTile icon={ShieldCheck} label="Safe Zones" accent="#10b981" />
          <FeatureTile icon={ListChecks} label="Tasks & Approval" accent="#3b82f6" />
          <FeatureTile icon={Target} label="Goals & Targets" accent="#a855f7" />
          <FeatureTile icon={Gift} label="Rewards & Promises" accent="#f59e0b" />
          <FeatureTile icon={BarChart3} label="AI Reports" accent="#ec4899" />
          <FeatureTile icon={MessageCircle} label="Family Chat" accent="#06b6d4" />
          <FeatureTile icon={ShieldCheck} label="Emergency SOS" accent="#f43f5e" />
        </div>
      </>
    ),
  },
  {
    id: 'childGuide', accent: '#10b981', title: 'Child Guide',
    sub: 'It only takes a moment for a child to get connected.',
    content: (a) => (
      <>
        <Hero icon={Smartphone} accent={a} />
        <SectionHead title="Child Guide" sub="Connect, complete tasks, and earn rewards." />
        <div className="flex flex-col gap-2.5">
          <StepRow n={1} icon={Hash} title="Enter your pairing code" sub="The 6-digit code from your parent." accent={a} />
          <StepRow n={2} icon={Link2} title="Connect to your parent" sub="Your devices are securely linked." accent="#06b6d4" />
          <StepRow n={3} icon={ListChecks} title="Complete your tasks" sub="Tick them off as you finish." accent="#3b82f6" />
          <StepRow n={4} icon={Gift} title="Earn rewards" sub="Unlock promises and prizes." accent="#f59e0b" />
          <StepRow n={5} icon={Flame} title="Build daily habits" sub="Keep streaks going day after day." accent="#ec4899" />
          <StepRow n={6} icon={Trophy} title="View achievements" sub="Celebrate badges and milestones." accent="#a855f7" />
        </div>
      </>
    ),
  },
  {
    id: 'childFeatures', accent: '#a855f7', title: 'Child Features',
    sub: 'A friendly, motivating space made just for kids.',
    content: (a) => (
      <>
        <Hero Art={DeviceArt} accent={a} />
        <SectionHead title="What Children Can Do" sub="Stay on track and have fun building good habits." />
        <div className="grid grid-cols-2 gap-2.5">
          <FeatureTile icon={ListChecks} label="My Tasks" accent="#3b82f6" />
          <FeatureTile icon={Gift} label="Rewards" accent="#f59e0b" />
          <FeatureTile icon={Trophy} label="Achievements" accent="#a855f7" />
          <FeatureTile icon={Target} label="Goals" accent="#10b981" />
          <FeatureTile icon={MessageCircle} label="Chat with Parent" accent="#06b6d4" />
          <FeatureTile icon={ShieldCheck} label="Emergency SOS" accent="#f43f5e" />
        </div>
      </>
    ),
  },
  {
    id: 'privacy', accent: '#2563eb', title: 'Privacy & Safety',
    sub: 'Trust is built in. Your family stays in control at all times.',
    legal: true,
    content: (a) => (
      <>
        <Hero Art={PrivacyArt} accent={a} />
        <SectionHead title="Privacy & Safety" sub="Safety and transparency are at the heart of AlphaGuard." />
        <div className="flex flex-col gap-2.5">
          <CommitRow icon={Lock} title="Your data is protected" sub="Encrypted in transit and at rest. Never sold." accent="#06b6d4" />
          <CommitRow icon={ShieldCheck} title="Parent controlled" sub="Parents set up and control everything." accent="#10b981" />
          <CommitRow icon={Eye} title="Child-safety focused" sub="Monitoring is transparent — never covert." accent="#a855f7" />
          <CommitRow icon={Ban} title="No unauthorized sharing" sub="No ads to children. No data sold or rented." accent="#f59e0b" />
        </div>
      </>
    ),
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Review affordance only: ?slide=N opens a specific section for screenshots.
  const initial = Math.min(Math.max(parseInt(new URLSearchParams(location.search).get('slide') || '0', 10) || 0, 0), SECTIONS.length - 1);
  const [i, setI] = useState(initial);
  const [reading, setReading] = useState(null); // legal slug shown in the inline sheet

  const s = SECTIONS[i];
  const last = i === SECTIONS.length - 1;

  // Completing OR skipping the guide marks onboarding done — it is never shown
  // again automatically (the splash routes onboarded users straight on). Then
  // we proceed to the existing Parent/Child selection.
  const finishOnboarding = () => { markOnboarded(); navigate('/role'); };
  const next = () => (last ? finishOnboarding() : setI((n) => n + 1));
  const prev = () => (i === 0 ? navigate('/welcome') : setI((n) => Math.max(0, n - 1)));
  // Hardware/browser back mirrors the Previous button.
  useStepHistory(i, 0, () => setI((n) => Math.max(0, n - 1)));

  const doc = reading ? legalDoc(reading) : null;

  return (
    <Screen
      align="start"
      glow={s.accent}
      footer={(
        <div className="flex items-center gap-3">
          <button onClick={prev} aria-label="Previous" className="ag-tap flex items-center justify-center w-[52px] h-[52px] rounded-full bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white flex-shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1"><Button iconRight={ChevronRight} onClick={next}>{last ? 'Get Started' : 'Next'}</Button></div>
        </div>
      )}
    >
      {/* Top: progress + skip */}
      <div className="w-full flex items-center justify-between gap-3 min-h-[44px] mb-2">
        <Progress count={SECTIONS.length} active={i} color={s.accent} />
        <button onClick={finishOnboarding} className="ag-tap text-slate-500 hover:text-white text-[13px] font-bold flex-shrink-0">Skip</button>
      </div>

      {/* Section content (animated) */}
      <div className="w-full pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="w-full pt-2"
          >
            {s.content(s.accent)}

            {/* Legal links — Terms, Privacy & Child Safety remain clickable. */}
            {s.legal && (
              <div className="mt-5">
                <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.12em] text-center mb-2.5">Read our policies</p>
                <div className="flex flex-col gap-2">
                  {[['terms', 'Terms of Service'], ['privacy', 'Privacy Policy'], ['child-safety', 'Child Safety Policy']].map(([slug, label]) => (
                    <button key={slug} onClick={() => setReading(slug)} className="ag-tap w-full flex items-center gap-3 p-3 rounded-2xl border border-white/[0.07] bg-[#0b0c14] hover:bg-white/[0.03] text-left">
                      <FileText size={16} className="text-cyan-400 flex-shrink-0" />
                      <span className="flex-1 text-white font-bold text-[13.5px]">{label}</span>
                      <ChevronRight size={16} className="text-slate-600" />
                    </button>
                  ))}
                </div>
                <p className="text-slate-600 text-[11.5px] font-medium text-center leading-relaxed mt-4 px-2">
                  AlphaGuard is and remains completely free. You'll review and accept these policies during setup.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Inline policy reader (keeps onboarding position; no navigation away) */}
      {doc && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setReading(null)} />
          <div className="relative z-10 w-full max-w-[440px] bg-[#0b0c14] border border-white/10 rounded-t-[28px] flex flex-col" style={{ maxHeight: '82vh' }}>
            <div className="flex items-center gap-3 p-5 border-b border-white/[0.07]">
              <div className="flex-1 min-w-0"><p className="text-white font-black text-[16px] truncate">{doc.title}</p><p className="text-slate-500 text-[12px] font-semibold">{EFFECTIVE}</p></div>
              <button onClick={() => setReading(null)} aria-label="Close" className="ag-tap w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-slate-300"><X size={17} /></button>
            </div>
            <div className="overflow-y-auto ag-no-scrollbar p-5 flex flex-col gap-3" style={{ paddingBottom: 'calc(1.25rem + var(--ag-safe-bottom))' }}>
              {doc.blocks.map((b, idx) => (
                <div key={idx}>{b.h && <p className="text-white font-bold text-[13.5px] mb-1">{b.h}</p>}<p className="text-slate-400 text-[12.5px] font-medium leading-relaxed">{b.t}</p></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
};

export default Onboarding;
