import React from 'react';

/**
 * Card — the single premium surface primitive.
 * Consistent radius, hairline border, soft elevation, optional interactivity.
 *
 * tone:    'surface' (default) | 'raised' | 'glass'
 * padded:  boolean (default true) — apply standard interior padding
 * interactive: boolean — adds press feedback for tappable cards
 */
const Card = ({
  children,
  tone = 'surface',
  padded = true,
  interactive = false,
  className = '',
  style,
  ...props
}) => {
  const tones = {
    surface: 'bg-[#0b0c14] border border-white/[0.06]',
    raised: 'bg-[#12121c] border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.28)]',
    glass: 'bg-white/[0.04] border border-white/10 backdrop-blur-xl',
  };

  return (
    <div
      className={`rounded-[22px] ${tones[tone]} ${padded ? 'p-5' : ''} ${
        interactive ? 'ag-tap cursor-pointer hover:border-white/15' : ''
      } ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
