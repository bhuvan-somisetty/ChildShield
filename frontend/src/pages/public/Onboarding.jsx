import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, Camera, Mic, Lock, ChevronRight, ChevronLeft, Bell, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    id: 'location',
    icon: MapPin,
    color: '#06b6d4', // Cyan
    title: "Track Your Child's Location",
    subtitle: "Discover your child's current and past locations, and receive alerts when they enter or leave established Safe Zones.",
    graphic: (
      <div className="relative w-48 h-36 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-3xl border border-white/10 bg-gradient-to-tr from-blue-950/45 to-slate-900/90 flex items-center justify-center overflow-hidden shadow-2xl">
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
              <MapPin size={26} className="text-red-500" />
              <span className="text-[8px] font-extrabold text-red-400 mt-1 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">School</span>
            </div>
          </div>
        </div>
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-[-12px] right-[-10px] bg-purple-500 border border-white/10 px-2.5 py-1 rounded-xl text-[9.5px] font-black text-white flex items-center gap-1 shadow-lg shadow-purple-500/15"
        >
          <Bell size={10} />
          <span>Exited School Zone</span>
        </motion.div>
      </div>
    )
  },
  {
    id: 'manage',
    icon: Lock,
    color: '#8b5cf6', // Purple
    title: "Manage Device Usage",
    subtitle: "Set scheduled downtimes, instantly pause the entire device, and monitor active screen usage constraints.",
    graphic: (
      <div className="relative w-32 h-40 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-2xl border border-white/10 bg-gradient-to-tr from-indigo-950/45 to-slate-900/90 flex flex-col items-center justify-center gap-3 shadow-2xl">
          <div className="w-10 h-1 bg-white/10 rounded-full absolute top-2" />
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            <Lock size={32} className="text-purple-400" />
          </motion.div>
          <span className="text-[9px] font-extrabold text-red-500 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full tracking-wider uppercase">
            Device Locked
          </span>
        </div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-4 right-[-32px] bg-blue-500 border border-white/10 px-2.5 py-1 rounded-xl text-[10px] font-bold text-white shadow-lg shadow-blue-500/15"
        >
          ⏳ 1h 30m Left
        </motion.div>
      </div>
    )
  },
  {
    id: 'surroundings',
    icon: Camera,
    color: '#3b82f6', // Blue
    title: "Listen & See Surroundings",
    subtitle: "In emergency states, remotely activate the audio listener or screen view feed to confirm your child is physically safe.",
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
          transition={{ delay: 0.3 }}
          className="absolute top-[-10px] bg-red-500 border border-white/10 px-2.5 py-1 rounded-xl text-[9.5px] font-black text-white flex items-center gap-1 shadow-lg shadow-red-500/15"
        >
          <AlertTriangle size={10} />
          <span>SOS Mode Triggered</span>
        </motion.div>
      </div>
    )
  },
  {
    id: 'consent',
    icon: ShieldCheck,
    color: '#fbbf24', // Gold
    title: "Terms & Consent",
    subtitle: "To enforce these safety protocols, parental consent is required to activate AlphaGuard AI supervision on this device.",
    termsText: "By clicking Agree, you ensure you have read and fully understood our Terms of Service and Privacy Policy. You expressly undertake to comply with the applicable laws and regulations in your territory regarding monitoring. You authorize AlphaGuard AI to securely transmit data from your child's device.",
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
    <div className="relative min-h-screen w-full bg-[#07070c] overflow-hidden flex flex-col items-center justify-center px-4 font-sans">
      
      {/* Background Ambience blurs */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] to-[#0f172a] pointer-events-none" />
      <div 
        className="absolute top-[20%] left-[10%] w-[320px] h-[320px] rounded-full filter blur-[100px] opacity-15 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: slide.color }}
      />
      
      {/* Onboarding glass container */}
      <div className="relative z-10 w-full max-w-[440px] px-6 py-10 bg-white/5 border border-white/5 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col items-center">
        
        {/* Carousel slide contents with slide-in transition */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={slide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center"
          >
            {/* Graphic Representation */}
            <div className="h-44 flex items-center justify-center mb-6">
              {slide.graphic}
            </div>

            {/* Text details */}
            <div className="text-center min-h-[120px] flex flex-col items-center">
              <h3 className="text-lg font-black text-white tracking-wide mb-3">{slide.title}</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-[340px]">
                {slide.subtitle}
              </p>
            </div>
            
            {/* Terms block */}
            {isLast && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-white/2 border border-white/5 rounded-2xl text-[10px] text-slate-500 leading-relaxed text-left max-h-[100px] overflow-y-auto"
              >
                {slide.termsText}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pagination Dots and progress lines */}
        <div className="flex items-center gap-2 my-8">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6' : 'w-1.5'}`} 
              style={{ backgroundColor: i === step ? slide.color : 'rgba(255,255,255,0.15)' }}
            />
          ))}
        </div>

        {/* Action button triggers */}
        <div className="w-full flex items-center gap-3">
          {step > 0 && (
            <button 
              onClick={handlePrev}
              className="px-4 py-3 border border-white/10 rounded-2xl text-slate-300 font-bold text-xs cursor-pointer flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <button 
            onClick={handleNext}
            className="flex-1 py-3.5 rounded-2xl text-white font-extrabold text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1 shadow-lg active:scale-95 transition-all duration-300"
            style={{ 
              background: isLast ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : `linear-gradient(135deg, ${slide.color}, #3b82f6)`,
              shadowColor: isLast ? 'rgba(79,70,229,0.35)' : `${slide.color}35`
            }}
          >
            <span>{isLast ? 'Agree & Proceed' : 'Continue'}</span>
            <ChevronRight size={14} strokeWidth={3} />
          </button>
        </div>

      </div>

    </div>
  );
};

export default Onboarding;
