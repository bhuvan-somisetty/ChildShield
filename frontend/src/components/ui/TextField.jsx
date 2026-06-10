import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * TextField — the single input primitive.
 * Premium label, leading icon, password reveal, validation states.
 * 16px font-size prevents iOS auto-zoom; min 52px height for comfortable touch.
 *
 * Props: label, icon, type, value, onChange, error, success, hint, ...rest
 */
const TextField = ({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  error,
  success,
  hint,
  className = '',
  ...rest
}) => {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (reveal ? 'text' : 'password') : type;

  const borderColor = error
    ? 'border-rose-500/50 focus-within:border-rose-500'
    : success
    ? 'border-emerald-500/40 focus-within:border-emerald-500'
    : 'border-white/[0.08] focus-within:border-blue-500/60';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] px-1">
          {label}
        </label>
      )}
      <div
        className={`flex items-center gap-2.5 px-4 min-h-[56px] rounded-2xl bg-[#0b0c14] border transition-colors duration-200 ${borderColor}`}
      >
        {Icon && <Icon size={18} className="text-slate-500 flex-shrink-0" />}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          className="w-full bg-transparent border-none outline-none text-white text-[16px] font-medium placeholder-slate-600 py-3"
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="ag-tap text-slate-500 hover:text-white p-1 -mr-1"
            tabIndex={-1}
            aria-label={reveal ? 'Hide password' : 'Show password'}
          >
            {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {(error || hint || success) && (
        <div className="flex items-center gap-1.5 px-1">
          {error ? (
            <AlertCircle size={12} className="text-rose-400 flex-shrink-0" />
          ) : success ? (
            <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
          ) : null}
          <span
            className={`text-[11px] font-semibold ${
              error ? 'text-rose-400' : success ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {error || success || hint}
          </span>
        </div>
      )}
    </div>
  );
};

export default TextField;
