import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, Camera, Mic, Lock, ChevronRight, ChevronLeft, Bell, AlertTriangle, Brain, Sparkles, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    id: 'location',
    icon: MapPin,
    color: '#06b6d4', // Cyan
    title: "Live Tracking & Safe Zones",
    subtitle: "Monitor active real-time locations and define custom safe boundaries with automatic entry and exit alerts.",
    graphic: (
      <div className="relative w-48 h-36 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-3xl border border-white/10 bg-gradient-to-tr from-cyan-950/45 to-slate-900/90 flex items-center justify-center overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,transparent_60%)]" />
          <div className="flex items-center gap-4 relative z-10">
            <motion.div 
              animate={{ scale: [1, 1.15, 1] }} 
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="flex flex-col items-center"
            >
              <MapPin size={26} className="text-emerald-400" />
              <span className="text-[8px] font-extrabold text-emerald-400 mt-1 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">Home</span>
            </motion.div>
            <div className="w-10 h-0.5 border-t border-dashed border-cyan-500/40" />
            <div className="flex flex-col items-center">
              <MapPin size={26} className="text-cyan-400" />
              <span className="text-[8px] font-extrabold text-cyan-400 mt-1 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">Safe Area</span>
            </div>
          </div>
        </div>
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-[-12px] right-[-10px] bg-cyan-500 border border-white/10 px-2.5 py-1 rounded-xl text-[9.5px] font-black text-[#030307] flex items-center gap-1 shadow-lg shadow-cyan-500/15"
        >
          <Bell size={10} />
          <span>Entered Safe Zone</span>
        </motion.div>
      </div>
    )
  },
  {
    id: 'manage',
    icon: Lock,
    color: '#8b5cf6', // Purple
    title: "Device Controls & Screen Time",
    subtitle: "Configure screen limits, bedtime restrictions, and lock device usage instantly when bounds are exceeded.",
    graphic: (
      <div className="relative w-32 h-40 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-2xl border border-white/10 bg-gradient-to-tr from-indigo-950/45 to-slate-900/90 flex flex-col items-center justify-center gap-3 shadow-2xl">
          <div className="w-10 h-1 bg-white/10 rounded-full absolute top-2" />
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 4, -4, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            <Lock size={32} className="text-purple-400" />
          </motion.div>
          <span className="text-[9px] font-extrabold text-red-500 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full tracking-wider uppercase">
            Device Paused
          </span>
        </div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-4 right-[-32px] bg-purple-500 border border-white/10 px-2.5 py-1 rounded-xl text-[10px] font-bold text-white shadow-lg"
        >
          ⏳ Time Limit Reached
        </motion.div>
      </div>
    )
  },
  {
    id: 'surroundings',
    icon: Camera,
    color: '#3b82f6', // Blue
    title: "Emergency Monitoring",
    subtitle: "Remotely check camera feeds or stream ambient audio feeds during active SOS states to confirm child safety.",
    graphic: (
      <div className="relative w-40 h-36 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-3xl border border-white/10 bg-gradient-to-tr from-blue-950/45 to-slate-900/90 flex items-center justify-center gap-4 shadow-2xl">
          <motion.div 
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-lg"
          >
            <Camera size={20} className="text-blue-400" />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
            className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg"
          >
            <Mic size={20} className="text-amber-400" />
          </motion.div>
        </div>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-[-10px] bg-red-500 border border-white/10 px-2.5 py-1 rounded-xl text-[9.5px] font-black text-white flex items-center gap-1 shadow-lg"
        >
          <Activity size={10} className="animate-pulse" />
          <span>Live Telemetry Stream</span>
        </motion.div>
      </div>
    )
  },
  {
    id: 'ai-insights',
    icon: Brain,
    color: '#10b981', // Green
    title: "AI Parenting Insights",
    subtitle: "Receive proactive advice, behavior diagnostics, screen-time trends, and automatic danger risk alerts.",
    graphic: (
      <div className="relative w-40 h-36 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-3xl border border-white/10 bg-gradient-to-tr from-emerald-950/45 to-slate-900/90 flex flex-col items-center justify-center p-4 shadow-2xl">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
            className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_70%)]"
          />
          <Brain size={36} className="text-emerald-400 mb-2 relative z-10" />
          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full z-10">
            <Sparkles size={10} className="text-emerald-400" />
            <span className="text-[8.5px] font-extrabold text-emerald-400 uppercase tracking-wider">Alpha AI Active</span>
          </div>
        </div>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-[-8px] bg-indigo-600 border border-white/10 px-2 py-0.5 rounded-lg text-[9px] font-extrabold text-white shadow-lg"
        >
          💡 Try App Blocker
        </motion.div>
      </div>
    )
  },
  {
    id: 'sos-protection',
    icon: ShieldCheck,
    color: '#fbbf24', // Gold
    title: "SOS & Family Protection",
    subtitle: "Instant emergency broadcasting, distress countdown triggers, and rapid security unlinking codes.",
    termsText: "By clicking Agree, you ensure you have read and fully understood our Terms of Service and Privacy Policy. You authorize AlphaGuard OS to transmit location telemetry and execute parental overrides on this device in accordance with global safety compliance frameworks.",
    graphic: (
      <div className="relative w-36 h-36 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-3xl border border-white/5 bg-gradient-to-tr from-slate-900 to-slate-950 transform rotate-[-4deg] opacity-50" />
        <div className="absolute w-full h-full rounded-3xl border border-amber-500/30 bg-gradient-to-tr from-[#12121c] to-slate-950 flex items-center justify-center shadow-2xl backdrop-blur-md">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <ShieldCheck size={48} className="text-amber-400" strokeWidth={1.5} />
          </motion.div>
        </div>
      </div>
    )
  }
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const slide = slides[step];
  const isLast = step === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigate('/role-selection', { replace: true });
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(prev => prev - 1);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030307] overflow-hidden flex flex-col items-center justify-center px-4 font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020308] to-[#0b0c14] pointer-events-none" />
      <div 
        className="absolute top-[20%] left-[10%] w-[320px] h-[320px] rounded-full filter blur-[100px] opacity-15 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: slide.color }}
      />
      
      {/* Onboarding Glass Card */}
      <div className="relative z-10 w-full max-w-[440px] px-6 py-8 bg-white/5 border border-white/5 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col items-center">
        
        {/* Navigation skip */}
        <div className="w-full flex items-center justify-between mb-4">
          {step > 0 ? (
            <button 
              onClick={handlePrev}
              className="text-slate-400 hover:text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>
          ) : <div />}
          {!isLast && (
            <button 
              onClick={() => setStep(slides.length - 1)}
              className="text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Skip
            </button>
          )}
        </div>

        {/* Carousel Content */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={slide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
            className="w-full flex flex-col items-center"
          >
            {/* Vector Graphic Widget */}
            <div className="h-40 flex items-center justify-center mb-6">
              {slide.graphic}
            </div>

            {/* Text details */}
            <div className="text-center min-h-[110px] flex flex-col items-center px-2">
              <h3 className="text-lg font-black text-white tracking-wide mb-2.5">{slide.title}</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-[340px]">
                {slide.subtitle}
              </p>
            </div>
            
            {/* Scrollable Terms for Consent Slide */}
            {isLast && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-3.5 bg-black/40 border border-white/5 rounded-2xl text-[9.5px] text-slate-500 leading-normal text-left max-h-[90px] overflow-y-auto"
              >
                {slide.termsText}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Indicator Pills */}
        <div className="flex items-center gap-1.5 my-6">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-5' : 'w-1'}`} 
              style={{ backgroundColor: i === step ? slide.color : 'rgba(255,255,255,0.12)' }}
            />
          ))}
        </div>

        {/* Bottom Primary Button */}
        <div className="w-full">
          <button 
            onClick={handleNext}
            className="w-full py-3.5 rounded-2xl text-[#030307] font-black text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1 shadow-lg active:scale-[0.98] transition-all duration-300"
            style={{ 
              background: isLast ? 'linear-gradient(135deg, #fbbf24, #d97706)' : `linear-gradient(135deg, ${slide.color}, #3b82f6)`,
            }}
          >
            <span>{isLast ? 'Agree & Enter' : 'Continue'}</span>
            <ChevronRight size={13} strokeWidth={3} />
          </button>
        </div>

      </div>

    </div>
  );
};

export default Onboarding;
