import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Screen } from '../components/ui';
import { EFFECTIVE, legalDoc } from '../data/legal';

// Public, no-auth policy reader at /legal/:slug. Lets the Welcome footer and the
// onboarding consent screen link to fully readable policies without requiring a
// session — the same content the in-app Legal Center renders (single source).
const PublicLegal = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const d = legalDoc(slug);
  return (
    <Screen align="start" glow="#2563eb">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/welcome'))} aria-label="Go back" className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-black text-white tracking-tight leading-tight">{d.title}</h1>
          <p className="text-slate-500 text-[13px] font-semibold mt-0.5">{EFFECTIVE}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 pb-6">
        {d.blocks.map((b, i) => (
          <div key={i} className="rounded-[22px] border border-white/[0.07] bg-[#0b0c14] p-5">
            {b.h && <p className="text-white font-black text-[14px] mb-1.5">{b.h}</p>}
            <p className="text-slate-400 text-[13px] font-medium leading-relaxed">{b.t}</p>
          </div>
        ))}
      </div>
    </Screen>
  );
};

export default PublicLegal;
