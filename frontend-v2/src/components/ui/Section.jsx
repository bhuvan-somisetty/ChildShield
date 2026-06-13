import React from 'react';

/**
 * Section — a labelled content group with consistent vertical rhythm.
 * Keeps related elements visually grouped (8pt spacing).
 */
const Section = ({ title, caption, children, gap = 4, className = '' }) => {
  const gapClass = { 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 5: 'gap-5', 6: 'gap-6' }[gap] || 'gap-4';
  return (
    <section className={`w-full flex flex-col ${gapClass} ${className}`}>
      {(title || caption) && (
        <div className="px-1">
          {title && <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.14em]">{title}</h2>}
          {caption && <p className="text-[13px] text-slate-500 font-semibold mt-1">{caption}</p>}
        </div>
      )}
      {children}
    </section>
  );
};

export default Section;
