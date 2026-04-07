import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Smartphone } from 'lucide-react';

const PairingSetup = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePair = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/device/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairingCode: code })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('child_session', JSON.stringify(data.session));
        navigate('/child/device');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '24px' }}>
      <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: 'var(--shadow-neon-cyan)' }}>
          <Smartphone size={40} color="#000" />
        </div>
        
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Link Device</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>Enter the 6-digit code provided on your parent's dashboard to activate supervision.</p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '24px', borderLeft: '3px solid var(--accent-red)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handlePair}>
          <input
            type="text"
            className="form-input"
            placeholder="000000"
            style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center', fontWeight: 'bold', marginBottom: '24px' }}
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
          />
          
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || code.length !== 6}>
            {loading ? 'Pairing...' : 'Activate Device'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PairingSetup;
