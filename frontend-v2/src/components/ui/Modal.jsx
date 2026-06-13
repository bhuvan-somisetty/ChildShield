import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Modal — bottom-sheet (mobile-native) or centered dialog.
 * variant: 'sheet' (default) | 'center'
 */
const Modal = ({ open, onClose, title, children, variant = 'sheet' }) => {
  const isSheet = variant === 'sheet';
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex"
          style={{ justifyContent: 'center', alignItems: isSheet ? 'flex-end' : 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className={`relative z-10 w-full bg-[#0b0c14] border border-white/10 ${
              isSheet ? 'rounded-t-[28px] max-w-[440px]' : 'rounded-[28px] max-w-[400px] m-6'
            }`}
            style={{ paddingBottom: isSheet ? 'calc(var(--ag-space-6) + var(--ag-safe-bottom))' : 'var(--ag-space-6)' }}
            initial={isSheet ? { y: '100%' } : { scale: 0.92, opacity: 0 }}
            animate={isSheet ? { y: 0 } : { scale: 1, opacity: 1 }}
            exit={isSheet ? { y: '100%' } : { scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
          >
            {isSheet && <div className="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-white/15" />}
            <div className="flex items-center justify-between px-6 pt-4 pb-2">
              <h3 className="text-[18px] font-black text-white">{title}</h3>
              <button onClick={onClose} className="ag-tap text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>
            <div className="px-6 pt-2">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
