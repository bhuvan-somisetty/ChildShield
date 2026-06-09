import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Screen, Button, ScreenHeader } from '../../components/ui';

const PairingSetup = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const submit = async (value) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/device/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairingCode: value }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('child_session', JSON.stringify(data.session));
        navigate('/child/device');
      } else {
        setError(data.error || 'Invalid code. Please try again.');
      }
    } catch (err) {
      setError('Connection failed. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(v);
    setError('');
    if (v.length === 6) submit(v);
  };

  return (
    <Screen
      ambient="brand"
      align="between"
      footer={
        <Button onClick={() => code.length === 6 && submit(code)} loading={loading} disabled={code.length !== 6} iconRight={ArrowRight}>
          Activate Device
        </Button>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col items-center text-center"
      >
        <ScreenHeader onBack={() => navigate(-1)} className="w-full mb-8" />

        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-5">
          <Smartphone size={30} className="text-cyan-400" />
        </div>
        <h1 className="text-[24px] font-black text-white tracking-tight leading-tight">Enter pairing code</h1>
        <p className="text-slate-500 text-[13px] font-semibold mt-2 mb-9 max-w-[300px] leading-relaxed">
          Type the 6-digit code shown on the parent dashboard to link this device.
        </p>

        {/* 6-cell code field */}
        <div className="relative w-full" onClick={() => inputRef.current?.focus()}>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0"
            maxLength={6}
          />
          <div className="flex items-center justify-center gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => {
              const filled = i < code.length;
              const isCursor = i === code.length;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-center w-12 h-16 rounded-2xl border-2 text-[26px] font-black text-white transition-all ${
                    filled
                      ? 'border-cyan-400/60 bg-cyan-500/5'
                      : isCursor
                      ? 'border-blue-500/60 bg-white/[0.03]'
                      : 'border-white/[0.08] bg-[#0b0c14]'
                  }`}
                >
                  {code[i] || ''}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px] py-3 px-4 rounded-2xl font-semibold max-w-[340px]">
            {error}
          </div>
        )}
      </motion.div>
    </Screen>
  );
};

export default PairingSetup;
