import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, X } from 'lucide-react';

const LogoutApprovalListener = () => {
  const { activeChild, token } = useAuth();
  const [pendingRequest, setPendingRequest] = useState(null);
  const [responding, setResponding] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'deny' | null

  // Poll for pending logout requests from child
  useEffect(() => {
    if (!activeChild?.id || !token) return;
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      try {
        const r = await fetch(`/api/device/logout-request/${activeChild.id}`);
        if (!r.ok) return;
        const d = await r.json();
        if (cancelled) return;
        if (d.success && d.request && d.request.status === 'pending') {
          setPendingRequest(d.request);
        } else {
          setPendingRequest(prev => prev?.status === 'pending' ? null : prev);
        }
      } catch {}
    };
    poll();
    const iv = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [activeChild?.id, token]);

  const respond = async (approved) => {
    if (!activeChild?.id) return;
    setResponding(true);
    try {
      const r = await fetch(`/api/device/logout-respond/${activeChild.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ approved }),
      });
      if (!r.ok) console.warn('[LogoutApproval] respond returned', r.status);
    } catch (err) {
      console.error('[LogoutApproval] respond error:', err.message);
    }
    setPendingRequest(null);
    setConfirmAction(null);
    setResponding(false);
  };

  if (!pendingRequest) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fade-in 0.3s' }}>
      <div style={{ background: '#0f172a', border: '2px solid rgba(245,158,11,0.5)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 0 60px rgba(245,158,11,0.3)', textAlign: 'center' }}>

        {/* Main notification - no confirm action active */}
        {!confirmAction && (
          <>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'pulse-dot 2s infinite' }}>
              <LogOut size={32} color="#f59e0b" />
            </div>
            <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>Sign-out Request</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
              <strong style={{ color: '#f59e0b', fontSize: '16px' }}>{pendingRequest.childName}</strong> is trying to sign out.
            </p>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '28px' }}>Do you want to allow the sign-out or keep the device connected?</p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmAction('deny')} disabled={responding}
                style={{ flex: 1, padding: '16px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '14px', color: '#ef4444', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>
                ✕ Keep Connected
              </button>
              <button onClick={() => setConfirmAction('approve')} disabled={responding}
                style={{ flex: 1, padding: '16px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '14px', color: '#10b981', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>
                ✓ Allow Logout
              </button>
            </div>
          </>
        )}

        {/* Confirm APPROVE */}
        {confirmAction === 'approve' && (
          <>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ShieldCheck size={32} color="#10b981" />
            </div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '900', marginBottom: '12px' }}>Are you sure you wanna tap yes?</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
              After you click <strong style={{ color: '#10b981' }}>Yes</strong>, device will get logout by <strong style={{ color: '#f59e0b' }}>{pendingRequest.childName}</strong> so u wanna log out?
            </p>
            <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '24px' }}>The child will need to reconnect to your account after this.</p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmAction(null)}
                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                Go Back
              </button>
              <button onClick={() => respond(true)} disabled={responding}
                style={{ flex: 1, padding: '14px', background: '#10b981', border: 'none', borderRadius: '12px', color: '#000', fontWeight: '800', fontSize: '14px', cursor: responding ? 'not-allowed' : 'pointer', opacity: responding ? 0.7 : 1 }}>
                {responding ? 'Processing...' : 'Yes, Logout Child'}
              </button>
            </div>
          </>
        )}

        {/* Confirm DENY */}
        {confirmAction === 'deny' && (
          <>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <X size={32} color="#ef4444" />
            </div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '900', marginBottom: '12px' }}>Are you sure you wanna tap no?</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
              If you click <strong style={{ color: '#ef4444' }}>No</strong>, device will stay connected. <strong style={{ color: '#f59e0b' }}>{pendingRequest.childName}</strong> will get message: <em style={{ color: '#ef4444' }}>"I'm sorry access declined by father"</em>
            </p>
            <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '24px' }}>The device will stay connected and supervised.</p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmAction(null)}
                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                Go Back
              </button>
              <button onClick={() => respond(false)} disabled={responding}
                style={{ flex: 1, padding: '14px', background: '#ef4444', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: responding ? 'not-allowed' : 'pointer', opacity: responding ? 0.7 : 1 }}>
                {responding ? 'Processing...' : 'Yes, Decline'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default LogoutApprovalListener;
