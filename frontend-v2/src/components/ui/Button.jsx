import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button — the single button primitive. Min 56px (lg) for comfortable touch.
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger'
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
  const height = size === 'md' ? 'min-h-[48px] text-[14px]' : 'min-h-[56px] text-[15px]';

  const variants = {
    primary:
      'text-[#030307] bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 shadow-[0_14px_44px_rgba(37,99,235,0.42)] border border-white/10',
    secondary:
      'text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/10',
    ghost:
      'text-slate-300 hover:text-white bg-transparent border border-transparent',
    danger:
      'text-white bg-gradient-to-r from-rose-600 to-red-600 shadow-[0_14px_44px_rgba(244,63,94,0.35)] border border-white/10',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`ag-tap relative inline-flex items-center justify-center gap-2 rounded-full font-extrabold tracking-wide px-6
        ${height} ${fullWidth ? 'w-full' : 'px-8'} ${variants[variant]}
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
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
