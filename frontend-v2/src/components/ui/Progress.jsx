import React from 'react';
import { motion } from 'framer-motion';

/**
 * Progress — Apple-style step indicator. The active step elongates into a pill.
 */
const Progress = ({ count, active, color = '#06b6d4', className = '' }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        className="h-1.5 rounded-full"
        animate={{ width: i === active ? 24 : 6, backgroundColor: i === active ? color : 'rgba(255,255,255,0.14)' }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      />
    ))}
  </div>
);

export default Progress;
