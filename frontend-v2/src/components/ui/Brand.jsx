import React from 'react';
import { Shield } from 'lucide-react';

export const BRAND_NAME = 'AlphaGuard AI';

/**
 * Brand — canonical logo lockup. variant: 'badge' | 'stacked' | 'inline'
 */
const Brand = ({ variant = 'inline', className = '' }) => {
  const Logo = (
    <div className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/25 to-cyan-500/10 border border-blue-500/30 shadow-[0_0_28px_rgba(37,99,235,0.3)]" style={{ width: 52, height: 52 }}>
      <Shield size={26} className="text-cyan-400" />
    </div>
  );

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md ${className}`}>
        <Shield size={14} className="text-cyan-400" />
        <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{BRAND_NAME}</span>
      </div>
    );
  }
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        {Logo}
        <span className="text-[18px] font-black text-white tracking-tight">{BRAND_NAME}</span>
      </div>
    );
  }
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {Logo}
      <span className="text-[16px] font-black text-white tracking-tight">{BRAND_NAME}</span>
    </div>
  );
};

export default Brand;
