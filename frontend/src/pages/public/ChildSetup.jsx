import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, User, ArrowRight, ArrowLeft } from 'lucide-react';

const ChildSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState(''); // 'boy' or 'girl'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNextStep = () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleInitPairing = async (selectedGender) => {
    setGender(selectedGender);
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/device/init-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childName: name, gender: selectedGender })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        navigate('/child-pairing', { 
          state: { childId: data.childId, pairingCode: data.pairingCode, childName: name, gender: selectedGender } 
        });
      } else {
        setError(data.error || 'Failed to initialize device.');
      }
    } catch (err) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      {/* Background Ambience */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'var(--accent-purple)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }}></div>

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '40px', position: 'relative', zIndex: 1 }}>
        
        {step === 1 ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(37,99,235, 0.1)', marginBottom: '16px', border: '1px solid rgba(37,99,235, 0.3)' }}>
                <Smartphone size={32} color="#2563eb" />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#fff' }}>Child Setup</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '14px' }}>Who will be using this device?</p>
            </div>

            {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '14px', left: '16px' }} />
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)} autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleNextStep()}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px 14px 44px', borderRadius: '12px', color: '#fff', fontSize: '16px', outline: 'none' }} placeholder="Child's First Name" />
              </div>

              <button 
                onClick={handleNextStep}
                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '600', fontSize: '16px', marginTop: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(37,99,235, 0.3)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Continue <ArrowRight size={18} />
              </button>
              
              <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', marginTop: '10px' }}>
                Cancel Setup
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <button onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                <ArrowLeft size={24} color="#64748b" />
              </button>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>Profile Gender</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Let's personalize {name}'s experience.</p>
              </div>
            </div>

            {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '30px' }}>
              
              <button 
                onClick={() => handleInitPairing('boy')} disabled={loading}
                style={{ background: 'rgba(56, 189, 248, 0.1)', border: '2px solid rgba(56, 189, 248, 0.3)', borderRadius: '16px', padding: '30px 10px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
              >
                <div style={{ fontSize: '48px' }}>ðŸ‘¦</div>
                <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '18px' }}>BOY</div>
              </button>

              <button 
                onClick={() => handleInitPairing('girl')} disabled={loading}
                style={{ background: 'rgba(244, 114, 182, 0.1)', border: '2px solid rgba(244, 114, 182, 0.3)', borderRadius: '16px', padding: '30px 10px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(244, 114, 182, 0.2)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(244, 114, 182, 0.1)'}
              >
                <div style={{ fontSize: '48px' }}>ðŸ‘§</div>
                <div style={{ color: '#f472b6', fontWeight: '700', fontSize: '18px' }}>GIRL</div>
              </button>

            </div>

             {loading && <div style={{ textAlign: 'center', color: '#2563eb', fontSize: '14px', fontWeight: '500' }}>Preparing profile and QR Code...</div>}

          </div>
        )}
      </div>
    </div>
  );
};

export default ChildSetup;
