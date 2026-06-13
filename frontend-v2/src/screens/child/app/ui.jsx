import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const Card = ({ children, className = '' }) => <div className={`rounded-[22px] border border-white/[0.07] bg-[#0b0c14] ${className}`}>{children}</div>;
export const Label = ({ children }) => <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em] px-1">{children}</p>;

export const Page = ({ title, sub, right, back = true, children }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        {back && <button onClick={() => navigate(-1)} aria-label="Back" className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>}
        <div className="flex-1 min-w-0"><h1 className="text-[22px] font-black text-white tracking-tight leading-tight">{title}</h1>{sub && <p className="text-slate-500 text-[13px] font-semibold mt-0.5">{sub}</p>}</div>
        {right}
      </div>
      {children}
    </div>
  );
};
