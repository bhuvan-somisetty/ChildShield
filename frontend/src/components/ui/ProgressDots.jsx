import React from 'react';

/**
 * ProgressDots — consistent step indicator for onboarding / wizards.
 * The active dot elongates into a pill (Apple-style).
 */
const ProgressDots = ({ count, active, color = '#3b82f6', className = '' }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="h-1.5 rounded-full transition-all duration-300 ease-out"
        style={{
          width: i === active ? 22 : 6,
          backgroundColor: i === active ? color : 'rgba(255,255,255,0.14)',
        }}
      />
    ))}
  </div>
);

export default ProgressDots;
