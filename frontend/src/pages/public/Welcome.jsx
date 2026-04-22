import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, Activity, MapPin, Lock } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/onboarding');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-primary)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Dynamic Background Blobs */}
      <div style={{ 
        position: 'absolute', 
        top: '20%', 
        left: '10%', 
        width: '500px', 
        height: '500px', 
        background: 'radial-gradient(circle, var(--accent-cyan) 0%, transparent 70%)', 
        opacity: 0.1, 
        filter: 'blur(100px)',
        animation: 'pulse 10s infinite alternate'
      }} />
      <div style={{ 
        position: 'absolute', 
        bottom: '20%', 
        right: '10%', 
        width: '600px', 
        height: '600px', 
        background: 'radial-gradient(circle, var(--accent-purple) 0%, transparent 70%)', 
        opacity: 0.1, 
        filter: 'blur(100px)',
        animation: 'pulse 8s infinite alternate-reverse'
      }} />

      <div className="animate-fade-in" style={{ 
        zIndex: 10, 
        textAlign: 'center', 
        padding: '0 24px', 
        maxWidth: '600px' 
      }}>
        {/* Animated Shield Logo */}
        <div style={{ 
          marginBottom: '40px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '30px', 
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 240, 255, 0.3)',
            animation: 'float 4s ease-in-out infinite'
          }}>
            <Shield size={50} color="#fff" />
          </div>
        </div>

        {/* Hero Text */}
        <h1 style={{ 
          fontSize: 'clamp(32px, 8vw, 48px)', 
          fontWeight: '900', 
          color: '#fff', 
          marginBottom: '20px',
          letterSpacing: '-0.03em',
          lineHeight: '1.1'
        }}>
          Welcome to <span style={{ 
            background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '900'
          }}>ChildShield AI</span>
        </h1>
        
        <p style={{ 
          fontSize: '18px', 
          color: 'var(--text-secondary)', 
          marginBottom: '48px',
          lineHeight: '1.6',
          maxWidth: '480px',
          marginInline: 'auto'
        }}>
          The next generation of parental control, powered by advanced AI to keep your children safe in the digital world.
        </p>

        {/* Feature Highlights (Micro-animations) */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          justifyContent: 'center', 
          marginBottom: '60px',
          flexWrap: 'wrap'
        }}>
          {[
            { icon: MapPin, label: 'Live Tracking', color: 'var(--accent-cyan)' },
            { icon: Activity, label: 'AI Monitoring', color: 'var(--accent-purple)' },
            { icon: Lock, label: 'Safe Zones', color: 'var(--accent-green)' }
          ].map((feature, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 16px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '100px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: `fadeIn 0.5s ease-out ${0.2 + i * 0.1}s forwards`,
              opacity: 0
            }}>
              <feature.icon size={16} color={feature.color} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button 
          onClick={handleContinue}
          style={{ 
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            color: '#fff',
            border: 'none',
            padding: '20px 48px',
            borderRadius: '100px',
            fontSize: '18px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 10px 30px rgba(0, 240, 255, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            marginInline: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 240, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 240, 255, 0.3)';
          }}
        >
          Get Started
          <ChevronRight size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Footer Info */}
      <div style={{ 
        position: 'absolute', 
        bottom: '30px', 
        fontSize: '12px', 
        color: 'var(--text-muted)',
        opacity: 0.6
      }}>
        © {new Date().getFullYear()} ChildShield AI. All rights reserved.
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.05; }
          100% { transform: scale(1.1); opacity: 0.15; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Welcome;
