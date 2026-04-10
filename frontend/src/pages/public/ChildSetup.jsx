import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, User, ArrowRight } from 'lucide-react';

const ChildSetup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/device/init-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childName: name })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        navigate('/child-pairing', { 
          state: { childId: data.childId, pairingCode: data.pairingCode, childName: name } 
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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(176, 38, 255, 0.1)', marginBottom: '16px', border: '1px solid rgba(176, 38, 255, 0.3)' }}>
            <Smartphone size={32} color="#b026ff" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#fff' }}>Child Setup</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '14px' }}>Who will be using this device?</p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ position: 'relative' }}>
              <User size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '14px', left: '16px' }} />
              <input 
                type="text" required value={name} onChange={e => setName(e.target.value)} autoFocus
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px 14px 44px', borderRadius: '12px', color: '#fff', fontSize: '16px', outline: 'none' }} placeholder="Child's First Name" />
            </div>
          </div>

          <button 
            onClick={handleNext} disabled={loading}
            style={{ background: '#b026ff', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '600', fontSize: '16px', marginTop: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(176, 38, 255, 0.3)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading ? 'Processing...' : <React.Fragment>Next Step <ArrowRight size={18} /></React.Fragment>}
          </button>
          
          <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', marginTop: '10px' }}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChildSetup;
