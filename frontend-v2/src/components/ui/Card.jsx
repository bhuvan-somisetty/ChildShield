import React from 'react';
import { motion } from 'framer-motion';

/**
 * Card — surface container. Optional `glass`, `selectable`, `selected`, `glow`.
 * Used for content blocks and large selection cards.
 */
const Card = ({
  children,
  selectable = false,
  selected = false,
  glass = false,
  glow = '#2563eb',
  onClick,
  className = '',
  ...props
}) => {
  const base = 'relative overflow-hidden rounded-[24px] border';
  const surface = glass
    ? 'bg-white/[0.05] backdrop-blur-xl'
    : selected
    ? 'bg-white/[0.06]'
    : 'bg-[#0b0c14]';
  const borderC = selected ? 'border-white/20' : 'border-white/[0.07]';

  if (selectable) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        animate={{ scale: selected ? 1 : 0.985, opacity: selected ? 1 : 0.72 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className={`ag-tap text-left ${base} ${surface} ${borderC} ${className}`}
        style={selected ? { boxShadow: `0 18px 50px ${glow}40` } : undefined}
        {...props}
      >
        {selected && (
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{ background: `radial-gradient(circle at 18% 40%, ${glow}26 0%, transparent 60%)` }}
          />
        )}
        {children}
      </motion.button>
    );
  }

  return (
    <div className={`${base} ${surface} ${borderC} ${className}`} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

export default Card;
