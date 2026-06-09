import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button — the single button primitive for the whole app.
 * Guarantees: min 48px height (≥44px touch target), consistent radius,
 * premium press feedback, loading state, full-width by default on mobile.
 *
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 * size:    'lg' (default, 56px) | 'md' (48px)
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  ...props
}) => {
  const height = size === 'md' ? 'min-h-[48px] text-[13px]' : 'min-h-[56px] text-[15px]';

  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-[#030307] shadow-[0_12px_40px_rgba(37,99,235,0.38)] hover:shadow-[0_16px_48px_rgba(6,182,212,0.5)] border border-white/10',
    secondary:
      'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1]',
    ghost:
      'bg-transparent text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-[0_12px_40px_rgba(239,68,68,0.35)] border border-white/10',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`ag-tap relative inline-flex items-center justify-center gap-2 rounded-full font-extrabold tracking-wide
        ${height} ${fullWidth ? 'w-full' : 'px-7'} ${variants[variant]}
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        px-6 ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>{typeof children === 'string' ? 'Please wait…' : children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={18} strokeWidth={2.5} />}
          <span>{children}</span>
          {IconRight && <IconRight size={18} strokeWidth={3} />}
        </>
      )}
    </button>
  );
};

export default Button;
