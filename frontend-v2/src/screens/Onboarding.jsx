import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Screen, Button, Progress } from '../components/ui';
import { LocationArt, DeviceArt, SosArt, AiArt, PrivacyArt } from './OnboardingArt';

const SLIDES = [
  { id: 'loc', accent: '#06b6d4', Art: LocationArt, title: 'Know Where Your Family Is', body: 'Real time family location sharing with intelligent arrival and departure alerts.' },
  { id: 'dev', accent: '#2563eb', Art: DeviceArt, title: 'Manage Device Usage', body: 'Create healthy digital habits with smart schedules, screen time controls, and device management.' },
  { id: 'sos', accent: '#f43f5e', Art: SosArt, title: 'Emergency SOS Protection', body: 'Instant emergency alerts with real time location sharing and rapid family notification.' },
  { id: 'ai', accent: '#a855f7', Art: AiArt, title: 'AI Powered Safety Monitoring', body: 'Intelligent monitoring helps detect unusual activity and delivers proactive family safety insights.' },
  { id: 'privacy', accent: '#3b82f6', Art: PrivacyArt, title: 'Privacy, Safety & Transparency', body: 'Your family’s data is encrypted, protected, and never sold. Safety and trust are built into every experience.' },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Review affordance only: ?slide=N opens a specific slide for screenshots.
  const initial = Math.min(Math.max(parseInt(new URLSearchParams(location.search).get('slide') || '0', 10) || 0, 0), SLIDES.length - 1);
  const [i, setI] = useState(initial);

  const s = SLIDES[i];
  const Art = s.Art;
  const last = i === SLIDES.length - 1;
  const next = () => (last ? navigate('/role') : setI(i + 1));

  return (
    <Screen
      align="between"
      glow={s.accent}
      footer={<Button iconRight={ChevronRight} onClick={next}>{last ? 'Agree & Continue' : 'Continue'}</Button>}
    >
      {/* Top: progress + skip */}
      <div className="w-full flex items-center justify-between min-h-[28px]">
        <Progress count={SLIDES.length} active={i} color={s.accent} />
        {!last ? (
          <button onClick={() => navigate('/role')} className="ag-tap text-slate-500 hover:text-white text-[13px] font-bold">Skip</button>
        ) : (
          <span className="w-8" />
        )}
      </div>

      {/* Middle: illustration + copy */}
      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col items-center"
          >
            <Art accent={s.accent} />
            <h1 className="text-[26px] font-black text-white tracking-tight leading-tight text-center mt-8 max-w-[300px]">{s.title}</h1>
            <p className="text-slate-400 text-[15px] font-medium mt-4 text-center max-w-[312px] leading-relaxed">{s.body}</p>
            {last && (
              <p className="text-slate-600 text-[12px] font-medium mt-6 text-center max-w-[320px] leading-relaxed">
                By continuing, you agree to the AlphaGuard AI Terms of Service and Privacy Policy. Monitoring features are designed to support family safety and transparency.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Screen>
  );
};

export default Onboarding;
