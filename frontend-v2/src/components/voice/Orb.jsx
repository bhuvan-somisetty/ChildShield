import React, { useRef, useEffect } from 'react';

/**
 * AudioVisualizer orb — Canvas 2D, audio-reactive, 60fps, no WebGL (chosen
 * deliberately: this machine renders WebGL black). States: idle (slow breathing),
 * listening (expand + waves), thinking (rotation + inner light), speaking (pulses).
 */
const lerp = (a, b, t) => a + (b - a) * t;

const Orb = ({ state = 'idle', level = 0, emergency = false, size = 300 }) => {
  const canvasRef = useRef(null);
  const raf = useRef(0);
  const t = useRef(0);
  const lvl = useRef(0);
  const particles = useRef([]);
  const stateRef = useRef(state);
  const emgRef = useRef(emergency);
  stateRef.current = state; emgRef.current = emergency;

  useEffect(() => { lvl.current = lerp(lvl.current, level, 0.4); }, [level]);

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    canvas.width = size * dpr; canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2;

    // particle field
    particles.current = Array.from({ length: 46 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: size * (0.34 + Math.random() * 0.22),
      sp: (0.0015 + Math.random() * 0.004) * (Math.random() > 0.5 ? 1 : -1),
      sz: 0.6 + Math.random() * 1.8,
      ph: Math.random() * Math.PI * 2,
    }));

    const palette = () => emgRef.current
      ? { a: '#ef4444', b: '#7f1d1d', c: '#fb7185' }
      : { a: '#3b82f6', b: '#7c3aed', c: '#22d3ee' };

    const draw = () => {
      t.current += reduce ? 0.004 : 0.016;
      lvl.current = lerp(lvl.current, level, 0.3);
      const st = stateRef.current;
      const p = palette();
      const breathe = 1 + Math.sin(t.current * 1.1) * 0.04;
      const energy = st === 'listening' ? 0.5 + lvl.current * 0.8
        : st === 'speaking' ? 0.45 + lvl.current * 0.7
        : st === 'thinking' ? 0.4 + Math.sin(t.current * 4) * 0.08
        : 0.28; // idle
      const baseR = size * 0.26 * breathe * (1 + energy * 0.18);

      ctx.clearRect(0, 0, size, size);

      // outer glow
      const glow = ctx.createRadialGradient(cx, cy, baseR * 0.4, cx, cy, baseR * 2.4);
      glow.addColorStop(0, `${p.a}55`);
      glow.addColorStop(0.4, `${p.b}22`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      // audio-reactive rings (listening / speaking)
      if (st === 'listening' || st === 'speaking') {
        for (let i = 0; i < 3; i++) {
          const rr = baseR * (1.25 + i * 0.32) + lvl.current * 28;
          ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `${p.c}${Math.round((0.28 - i * 0.08) * 255).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = 1.5; ctx.stroke();
        }
      }

      // rotating thinking ring
      if (st === 'thinking') {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t.current * 1.6);
        ctx.beginPath(); ctx.arc(0, 0, baseR * 1.5, -0.6, 1.9);
        ctx.strokeStyle = `${p.c}cc`; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, baseR * 1.5, Math.PI - 0.6, Math.PI + 1.9);
        ctx.strokeStyle = `${p.a}aa`; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
      }

      // particles
      particles.current.forEach((pt) => {
        pt.a += pt.sp * (1 + energy);
        const wobble = Math.sin(t.current * 2 + pt.ph) * 6 * (0.4 + energy);
        const r = pt.r + wobble;
        const x = cx + Math.cos(pt.a) * r;
        const y = cy + Math.sin(pt.a) * r;
        const alpha = 0.25 + energy * 0.55;
        ctx.beginPath(); ctx.arc(x, y, pt.sz * (0.8 + energy * 0.8), 0, Math.PI * 2);
        ctx.fillStyle = `${p.c}${Math.round(Math.min(1, alpha) * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });

      // core orb — layered radial gradient
      const core = ctx.createRadialGradient(cx - baseR * 0.3, cy - baseR * 0.35, baseR * 0.1, cx, cy, baseR);
      core.addColorStop(0, '#ffffff');
      core.addColorStop(0.25, p.c);
      core.addColorStop(0.6, p.a);
      core.addColorStop(1, p.b);
      ctx.beginPath(); ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.fillStyle = core; ctx.fill();

      // inner light highlight
      ctx.beginPath(); ctx.arc(cx - baseR * 0.28, cy - baseR * 0.3, baseR * 0.34, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();

      // moving inner light band (thinking/speaking)
      if (st === 'thinking' || st === 'speaking') {
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, baseR, 0, Math.PI * 2); ctx.clip();
        const band = ctx.createLinearGradient(cx - baseR, cy + Math.sin(t.current * 3) * baseR, cx + baseR, cy);
        band.addColorStop(0, 'transparent'); band.addColorStop(0.5, 'rgba(255,255,255,0.22)'); band.addColorStop(1, 'transparent');
        ctx.fillStyle = band; ctx.fillRect(cx - baseR, cy - baseR, baseR * 2, baseR * 2);
        ctx.restore();
      }

      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf.current);
  }, [size, level]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} aria-hidden="true" />;
};

export default Orb;
