import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, Camera, Mic, Monitor, Lock, ChevronRight, ChevronLeft, Bell, AlertTriangle } from 'lucide-react';

const slides = [
  {
    id: 'location',
    icon: MapPin,
    color: '#10b981',
    title: "Track Your Child's Location",
    subtitle: "Discover your child's current and past locations, and receive alerts when they enter or leave established Safe Zones.",
    graphic: (
      <div style={{ position: 'relative', width: '180px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: '100%', height: '100%', border: '2px solid rgba(251, 191, 36, 0.6)', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.7), rgba(15, 23, 42, 0.9))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: '150%', height: '150%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 60%)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MapPin size={32} color="#10b981" />
              <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold', marginTop: '4px', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>School</div>
            </div>
            <div style={{ width: '40px', height: '2px', background: 'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'2\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'4\' height=\'2\' fill=\'%2310b981\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />
            <MapPin size={32} color="#ef4444" />
          </div>
        </div>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#8b5cf6', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 10px rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Bell size={12} /> Exited Geofence
        </div>
      </div>
    )
  },
  {
    id: 'manage',
    icon: Lock,
    color: '#8b5cf6',
    title: "Manage Device Usage",
    subtitle: "Set scheduled downtimes, instantly pause the entire device, and monitor their active screen time.",
    graphic: (
      <div style={{ position: 'relative', width: '120px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: '100%', height: '100%', border: '2px solid rgba(251, 191, 36, 0.6)', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.7), rgba(15, 23, 42, 0.9))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', position: 'absolute', top: '10px' }} />
          <Lock size={40} color="#8b5cf6" strokeWidth={1.5} />
          <div style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>DEVICE LOCKED</div>
        </div>
        <div style={{ position: 'absolute', bottom: '15px', right: '-30px', background: '#3b82f6', padding: '8px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: 'bold', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 15px rgba(59,130,246,0.4)' }}>
          â³ 1h 30m
        </div>
      </div>
    )
  },
  {
    id: 'surroundings',
    icon: Camera,
    color: '#2563eb',
    title: "Listen & See Surroundings",
    subtitle: "In emergencies, remotely activate the camera or microphone to ensure your child is physically safe.",
    graphic: (
      <div style={{ position: 'relative', width: '160px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: '100%', height: '100%', border: '2px solid rgba(251, 191, 36, 0.6)', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.7), rgba(15, 23, 42, 0.9))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
           <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(37,99,235,0.2)' }}>
             <Camera size={24} color="#2563eb" />
           </div>
           <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(245,158,11,0.2)' }}>
             <Mic size={24} color="#f59e0b" />
           </div>
        </div>
        <div style={{ position: 'absolute', top: '-15px', background: '#ef4444', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={12} /> Emergency SOS
        </div>
      </div>
    )
  },
  {
    id: 'consent',
    icon: ShieldCheck,
    color: '#fbbf24', // Gold motif for final consent
    title: "Terms & Conditions",
    subtitle: "To enforce these safety protocols, parental consent is required to activate ChildShield AI supervision on this device.",
    termsText: "By clicking Agree, you ensure you have read and fully understood our Terms of Service and Privacy Policy. You expressly undertake to comply with the applicable laws and regulations in your territory regarding monitoring. You authorize ChildShield AI to securely transmit data from your child's device.",
    graphic: (
      <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: '100%', height: '100%', border: '2px solid rgba(251, 191, 36, 0.5)', borderRadius: '24px', transform: 'rotate(-5deg)', background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(15, 23, 42, 0.8))' }} />
        <div style={{ position: 'absolute', width: '100%', height: '100%', border: '2px solid rgba(251, 191, 36, 0.8)', borderRadius: '24px', transform: 'rotate(5deg)', background: 'linear-gradient(135deg, rgba(30,58,138,0.8), rgba(0,0,0,0.6))', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(251, 191, 36, 0.15)' }}>
          <ShieldCheck size={56} color="#fbbf24" strokeWidth={1.5} />
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

  const handleFinish = () => {
    // For demo purposes, we do not cache onboarding locally so it always shows on load
    navigate('/role-selection', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* Background ambience (Deep Blue) */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 50% 30%, #0f172a 0%, #020617 100%)', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '20%', left: '15%', width: '300px', height: '300px', background: slide.color, filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%', transition: 'all 0.8s ease' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '15%', width: '400px', height: '400px', background: '#1e3a8a', filter: 'blur(150px)', opacity: 0.3, borderRadius: '50%', transition: 'all 0.8s ease' }} />

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '0 24px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Removed Skip Button entirely */}
        <div style={{ width: '100%', height: '40px' }} />

        {/* Central Graphic Area */}
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px', animation: 'float 6s ease-in-out infinite' }}>
          {slide.graphic}
        </div>

        {/* Text Content */}
        <div style={{ textAlign: 'center', minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '16px', letterSpacing: '0.02em', lineHeight: 1.3 }}>{slide.title}</h2>
          
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: isLast ? '12px' : '0', maxWidth: '360px' }}>
            {slide.subtitle}
          </p>

          {isLast && (
            <p style={{ color: '#64748b', fontSize: '11px', lineHeight: 1.6, marginTop: 'auto', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
              {slide.termsText}
            </p>
          )}
        </div>

        {/* Pagination Dots */}
        <div style={{ display: 'flex', gap: '8px', margin: '30px 0' }}>
          {slides.map((_, i) => (
            <div key={i} style={{ width: i === step ? '24px' : '6px', height: '6px', borderRadius: '4px', background: i === step ? slide.color : 'rgba(255,255,255,0.15)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          ))}
        </div>

        {/* Action Button */}
        <div style={{ width: '100%', paddingBottom: '40px' }}>
          <button 
            onClick={isLast ? handleFinish : () => setStep(step + 1)}
            style={{ 
              width: '100%', padding: '18px', background: isLast ? '#4f46e5' : slide.color, 
              border: 'none', borderRadius: '16px', color: isLast ? '#fff' : '#0f172a', 
              fontWeight: '800', fontSize: '16px', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
              boxShadow: isLast ? '0 10px 30px rgba(79, 70, 229, 0.3)' : `0 10px 30px ${slide.color}40`, 
              transition: 'all 0.3s' 
            }}
          >
            {isLast ? 'Agree to Terms' : 'Continue'}
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>

      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
