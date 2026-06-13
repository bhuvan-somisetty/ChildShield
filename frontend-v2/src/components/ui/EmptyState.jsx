import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState — calm placeholder for empty content areas.
 */
const EmptyState = ({ icon: Icon = Inbox, title, body, action, className = '' }) => (
  <div className={`flex flex-col items-center text-center px-6 py-10 ${className}`}>
    <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/[0.08] mb-5">
      <Icon size={28} className="text-slate-500" />
    </div>
    {title && <h3 className="text-[16px] font-black text-white">{title}</h3>}
    {body && <p className="text-[13px] text-slate-500 font-semibold mt-2 max-w-[260px] leading-relaxed">{body}</p>}
    {action && <div className="mt-5 w-full max-w-[240px]">{action}</div>}
  </div>
);

export default EmptyState;
