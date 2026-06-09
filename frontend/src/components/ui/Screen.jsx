import React from 'react';

/**
 * Screen — the root container for every full-page mobile view.
 * Handles: safe-area insets, the premium dark ambient background,
 * a centered max-width column (phone-first, graceful on tablet/desktop),
 * and optional bottom-anchored action zone.
 *
 * Props:
 *  - children        main scrollable content
 *  - footer          bottom-anchored node (primary actions); gets safe-area padding
 *  - ambient         'brand' | 'none'  (default 'brand') — ambient glow background
 *  - glowColor       override ambient glow color
 *  - scroll          allow content scroll (default true)
 *  - align           'center' | 'between' | 'end' (default 'center')
 *  - maxWidth        content column max width (default 480)
 *  - className       extra classes on the content column
 */
const Screen = ({
  children,
  footer,
  ambient = 'brand',
  glowColor,
  scroll = true,
  align = 'center',
  maxWidth = 480,
  className = '',
}) => {
  const justify =
    align === 'between' ? 'justify-between' : align === 'end' ? 'justify-end' : 'justify-center';

  return (
    <div className="relative ag-min-h-screen w-full bg-[#030307] overflow-hidden font-sans text-white flex flex-col">
      {/* Ambient premium background */}
      {ambient !== 'none' && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#05060d] via-[#030307] to-[#02040a]" />
          <div
            className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[120vw] max-w-[640px] aspect-square rounded-full blur-[120px] opacity-25"
            style={{ background: glowColor || 'radial-gradient(circle, #2563eb 0%, transparent 60%)' }}
          />
          <div
            className="absolute bottom-[-15%] right-[-10%] w-[80vw] max-w-[460px] aspect-square rounded-full blur-[120px] opacity-15"
            style={{ background: glowColor || 'radial-gradient(circle, #06b6d4 0%, transparent 60%)' }}
          />
        </div>
      )}

      {/* Content column */}
      <div
        className={`relative z-10 flex-1 w-full mx-auto flex flex-col ${justify} ${
          scroll ? 'overflow-y-auto ag-no-scrollbar' : 'overflow-hidden'
        } ${className}`}
        style={{
          maxWidth,
          paddingTop: 'calc(var(--ag-space-6) + var(--ag-safe-top))',
          paddingLeft: 'calc(var(--ag-space-6) + var(--ag-safe-left))',
          paddingRight: 'calc(var(--ag-space-6) + var(--ag-safe-right))',
          paddingBottom: footer ? 'var(--ag-space-4)' : 'calc(var(--ag-space-6) + var(--ag-safe-bottom))',
        }}
      >
        {children}
      </div>

      {/* Bottom-anchored footer (primary actions) */}
      {footer && (
        <div
          className="relative z-20 w-full mx-auto"
          style={{
            maxWidth,
            paddingLeft: 'calc(var(--ag-space-6) + var(--ag-safe-left))',
            paddingRight: 'calc(var(--ag-space-6) + var(--ag-safe-right))',
            paddingTop: 'var(--ag-space-4)',
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
