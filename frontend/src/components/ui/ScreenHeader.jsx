import React from 'react';
import { ChevronLeft } from 'lucide-react';

/**
 * ScreenHeader — consistent top bar for inner screens.
 * Optional back button (44x44 target), title/subtitle, and a right slot.
 */
const ScreenHeader = ({ title, subtitle, onBack, right, className = '' }) => (
  <div className={`flex items-center gap-3 w-full ${className}`}>
    {onBack && (
      <button
        onClick={onBack}
        aria-label="Go back"
        className="ag-tap flex items-center justify-center w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white flex-shrink-0"
      >
        <ChevronLeft size={20} />
      </button>
    )}
    {(title || subtitle) && (
      <div className="flex-1 min-w-0">
        {title && <h1 className="text-lg font-black text-white tracking-tight leading-tight truncate">{title}</h1>}
        {subtitle && (
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.12em] mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
    )}
    {right && <div className="flex-shrink-0">{right}</div>}
  </div>
);

export default ScreenHeader;
