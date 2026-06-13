import React from 'react';
import { ChevronLeft } from 'lucide-react';

/**
 * Header — top bar for inner screens. Optional 44px back target,
 * title/subtitle, and right slot.
 */
const Header = ({ title, subtitle, onBack, right, className = '' }) => (
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
        {title && <h1 className="text-[19px] font-black text-white tracking-tight leading-tight truncate">{title}</h1>}
        {subtitle && <p className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.12em] mt-0.5 truncate">{subtitle}</p>}
      </div>
    )}
    {right && <div className="flex-shrink-0">{right}</div>}
  </div>
);

export default Header;
