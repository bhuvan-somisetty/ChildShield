import React from 'react';
import { motion } from 'framer-motion';

/**
 * Screen — root container for every mobile view.
 * Dark ambient background, safe-area insets, centered phone-width column,
 * optional bottom-anchored footer, and a built-in page transition.
 */
const Screen = ({
  children,
  footer,
  align = 'center',          // 'center' | 'between' | 'end' | 'start'
  scroll = true,
  glow = '#2563eb',
  maxWidth = 440,
  className = '',
}) => {
  const justify = {
    center: 'justify-center',
    between: 'justify-between',
    end: 'justify-end',
    start: 'justify-start',
  }[align];

  return (
    <div className="relative ag-min-h-screen w-full overflow-hidden flex flex-col items-center" style={{ background: 'var(--ag-bg)' }}>
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#06070f] via-[#030307] to-[#02030a]" />
        <div
          className="absolute -top-[12%] left-1/2 -translate-x-1/2 w-[120vw] max-w-[620px] aspect-square rounded-full blur-[130px] opacity-25"
          style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 60%)` }}
        />
        <div
          className="absolute bottom-[-18%] right-[-12%] w-[80vw] max-w-[440px] aspect-square rounded-full blur-[130px] opacity-[0.12]"
          style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 60%)` }}
        />
      </div>

      {/* Content column */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-10 flex-1 w-full min-w-0 flex flex-col ${justify} ${
          scroll ? 'overflow-y-auto overflow-x-hidden ag-no-scrollbar' : 'overflow-hidden'
        } ${className}`}
        style={{
          maxWidth,
          minWidth: 0,
          paddingTop: 'calc(var(--ag-space-6) + var(--ag-safe-top))',
          paddingLeft: 'calc(var(--ag-space-6) + var(--ag-safe-left))',
          paddingRight: 'calc(var(--ag-space-6) + var(--ag-safe-right))',
          paddingBottom: footer ? 'var(--ag-space-4)' : 'calc(var(--ag-space-6) + var(--ag-safe-bottom))',
        }}
      >
        {children}
      </motion.div>

      {/* Footer */}
      {footer && (
        <div
          className="relative z-20 w-full min-w-0"
          style={{
            maxWidth,
            paddingLeft: 'calc(var(--ag-space-6) + var(--ag-safe-left))',
            paddingRight: 'calc(var(--ag-space-6) + var(--ag-safe-right))',
            paddingTop: 'var(--ag-space-3)',
            paddingBottom: 'calc(var(--ag-space-5) + var(--ag-safe-bottom))',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default Screen;
