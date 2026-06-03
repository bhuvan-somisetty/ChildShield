import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, Activity, Brain, Zap } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#0a0a0f',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Gold ambient glow */}
      <div style={{ 
        position: 'absolute', top: '15%', left: '5%',
        width: '500px', height: '500px', 
        background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', 
        filter: 'blur(80px)', pointerEvents: 'none'
      }} />
      {/* Red ambient glow */}
      <div style={{ 
        position: 'absolute', bottom: '10%', right: '5%',
        width: '600px', height: '600px', 
        background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)', 
        filter: 'blur(100px)', pointerEvents: 'none'
      }} />
      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px', pointerEvents: 'none'
      }} />

      <div className="animate-fade-in" style={{ zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: '640px' }}>
        
        {/* Animated Shield Logo */}
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            width: '100px', height: '100px', borderRadius: '28px', 
            background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(239,68,68,0.15) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(37,99,235,0.25), 0 20px 60px rgba(0,0,0,0.6)',
            border: '1px solid rgba(37,99,235,0.35)',
            animation: 'agFloat 4s ease-in-out infinite'
          }}>
            <Shield size={50} color="#2563eb" />
          </div>
        </div>

        {/* AI Pill Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)',
          borderRadius: '100px', padding: '6px 16px', marginBottom: '28px'
        }}>
          <Brain size={13} color="#2563eb" />
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', letterSpacing: '0.5px' }}>
            Smart AI Parenting for Gen Alpha
          </span>
        </div>

        {/* Hero Text */}
        <h1 style={{ 
          fontSize: 'clamp(34px, 8vw, 52px)', fontWeight: '900', color: '#fff', 
          marginBottom: '20px', letterSpacing: '-0.03em', lineHeight: '1.1'
        }}>
          Welcome to{' '}
          <span style={{ 
            background: 'linear-gradient(90deg, #2563eb, #60a5fa, #2563eb)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundSize: '200% auto', animation: 'agShimmer 3s linear infinite'
          }}>AlphaGuard</span>
          <span style={{ color: 'rgba(37,99,235,0.5)' }}> AI</span>
        </h1>
        
        <p style={{ 
          fontSize: '17px', color: '#64748b', marginBottom: '48px',
          lineHeight: '1.7', maxWidth: '480px', marginInline: 'auto'
        }}>
          Not just parental controls – an <strong style={{ color: '#94a3b8' }}>AI-powered behavior + safety system</strong> built for the next generation.
        </p>

        {/* Feature Pills */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '60px', flexWrap: 'wrap' }}>
          {[
            { icon: Brain, label: 'AI Behavior Insights', color: '#2563eb' },
            { icon: Activity, label: 'Smart Monitoring', color: '#ef4444' },
            { icon: Zap, label: 'Focus Mode', color: '#f59e0b' }
          ].map((feature, i) => (
            <div key={i} style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '10px 18px', background: 'rgba(255,255,255,0.04)', 
              borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)',
              animation: `agFadeIn 0.5s ease-out ${0.2 + i * 0.1}s forwards`, opacity: 0
            }}>
              <feature.icon size={15} color={feature.color} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button 
          onClick={() => navigate('/onboarding')}
          id="welcome-get-started"
          style={{ 
            background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
            color: '#0a0a0f', border: 'none', padding: '18px 52px',
            borderRadius: '100px', fontSize: '17px', fontWeight: '800',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 10px 40px rgba(37,99,235,0.35)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', marginInline: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 16px 50px rgba(37,99,235,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(37,99,235,0.35)';
          }}
        >
          Get Started
          <ChevronRight size={22} strokeWidth={3} />
        </button>
      </div>

      {/* Footer */}
      <div style={{ 
        position: 'absolute', bottom: '28px', fontSize: '12px', 
        color: 'rgba(255, 255, 255, 0.4)'
      }}>
        © {new Date().getFullYear()} AlphaGuard AI · All rights reserved
      </div>

      <style>{`
        @keyframes agFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(1deg); }
        }
        @keyframes agFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes agShimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
};

export default Welcome;
