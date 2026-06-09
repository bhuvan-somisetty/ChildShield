import React from 'react';
import { Shield } from 'lucide-react';

/**
 * BrandMark — the canonical AlphaGuard AI logo lockup.
 * Single source of truth for the brand name so it never drifts.
 *
 * variant: 'badge' (pill) | 'stacked' (icon over name) | 'inline' (icon + name row)
 */
export const BRAND_NAME = 'AlphaGuard AI';

const BrandMark = ({ variant = 'inline', size = 'md', className = '' }) => {
  const iconSize = size === 'lg' ? 30 : size === 'sm' ? 16 : 22;

  const Logo = (
    <div
      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-blue-500/30 shadow-[0_0_24px_rgba(37,99,235,0.25)]"
      style={{ width: iconSize + 22, height: iconSize + 22 }}
    >
      <Shield size={iconSize} className="text-cyan-400" />
    </div>
  );

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md ${className}`}
      >
        <Shield size={14} className="text-cyan-400" />
        <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
          {BRAND_NAME}
        </span>
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        {Logo}
        <span className="text-lg font-black text-white tracking-tight">{BRAND_NAME}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {Logo}
      <span className="text-base font-black text-white tracking-tight">{BRAND_NAME}</span>
    </div>
  );
};

export default BrandMark;
