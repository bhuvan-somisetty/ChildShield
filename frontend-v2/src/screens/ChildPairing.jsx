import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hash, ArrowRight } from 'lucide-react';
import { Screen, Button } from '../components/ui';
import { api, setToken } from '../lib/agClient';

// Child device pairing. The parent device generates a 6-digit code (backend mints
// it on the authenticated POST /children call); the child enters it here. The
// code is validated against PostgreSQL via POST /pair/claim — invalid or used
// codes are rejected by the server. On success the child receives a real device
// token bound to the parent's pairing.
const ChildPairing = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    if (code.length !== 6 || busy) return;
    setBusy(true); setError('');
    try {
      const res = await api.claimPairing(code, 'web'); // → { token, child, pairingId }
      setToken(res.token);
      // Persist the child token + pairing so the realtime socket (session.js)
      // reconnects this device across reloads without re-entering the code.
      localStorage.setItem('ag_child_token', JSON.stringify(res.token));
      localStorage.setItem('ag_pairing', JSON.stringify({ pairingId: res.pairingId, childId: res.child.id, code }));
      navigate('/child/connected');
    } catch (err) {
      setError(err.message && err.message.toLowerCase().includes('invalid')
        ? 'That code is invalid or has already been used.'
        : 'Pairing failed. Check the code and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen align="between" glow="#06b6d4"
      footer={<Button iconRight={ArrowRight} loading={busy} disabled={code.length !== 6} onClick={connect}>Connect to Parent</Button>}>
      <div className="w-full flex flex-col items-center text-center pt-2">
        <h1 className="text-[27px] font-bold text-white leading-[1.32] max-w-[320px]">
          Connect to Parent<br />Account
        </h1>
        <p className="text-slate-500 text-[14px] mt-3 mb-9 max-w-[300px] font-semibold leading-relaxed">
          Enter the 6-digit pairing code shown on your parent’s device.
        </p>

        <div className="flex items-center gap-2 mb-5">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/15"><Hash size={12} className="text-cyan-400" /></span>
          <span className="text-[12px] text-slate-400 font-bold uppercase tracking-[0.14em]">Pairing code</span>
        </div>

        <div className="relative w-full" onClick={(e) => e.currentTarget.querySelector('input').focus()}>
          <input
            autoFocus type="tel" inputMode="numeric" value={code} maxLength={6}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            className="absolute inset-0 w-full h-full opacity-0"
          />
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`flex items-center justify-center w-12 h-14 rounded-2xl border-2 text-[22px] font-black text-white transition-colors ${
                i < code.length ? 'border-cyan-400/60 bg-cyan-500/[0.06]' : i === code.length ? 'border-blue-500/60 bg-white/[0.03]' : 'border-white/[0.08] bg-[#0b0c14]'}`}>
                {code[i] || ''}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-rose-400 text-[12.5px] font-semibold mt-5 max-w-[300px]">
            {error}
          </motion.p>
        )}
      </div>

      <p className="text-center text-slate-600 text-[12px] font-semibold">Your connection is end-to-end encrypted.</p>
    </Screen>
  );
};

export default ChildPairing;
