import React from 'react';
import clsx from 'clsx';

export type LogoVariant = 'primary' | 'full' | 'horizontal' | 'icon' | 'monochrome' | 'dark' | 'glow';

interface LogoProps {
  variant?: LogoVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'primary',
  size = 'md',
  className,
}) => {
  const sizeMap = {
    sm: { base: 'text-lg', sup: 'text-xs', heaven: 'text-[9px]', sub: 'text-[7px]' },
    md: { base: 'text-2xl', sup: 'text-sm', heaven: 'text-xs', sub: 'text-[9px]' },
    lg: { base: 'text-4xl', sup: 'text-lg', heaven: 'text-sm', sub: 'text-xs' },
    xl: { base: 'text-6xl', sup: 'text-2xl', heaven: 'text-lg', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  // SVG-based Monogram with Geometric Elegance & subtle connection motif
  const renderMonogram = (extraClass = '') => (
    <div className={clsx('inline-flex items-start font-black tracking-tight select-none relative', extraClass)}>
      {/* Subtle Connection Glow Aura */}
      {variant === 'glow' && (
        <span className="absolute -inset-2 bg-gradient-to-r from-[#9B5CFF] via-[#FF4F81] to-[#FF91B5] opacity-40 blur-lg rounded-full pointer-events-none animate-pulse" />
      )}

      {/* Main KA letters with luxurious gradient or monochrome */}
      <span
        className={clsx(
          'font-extrabold tracking-[-0.04em] leading-none',
          variant === 'monochrome'
            ? 'text-white'
            : variant === 'dark'
            ? 'text-black'
            : 'bg-gradient-to-br from-[#B28CFF] via-[#FF4F81] to-[#FF91B5] bg-clip-text text-transparent drop-shadow-sm',
          currentSize.base
        )}
      >
        KA
      </span>

      {/* True Superscript ² positioned above and slightly to the right of A */}
      <sup
        className={clsx(
          'font-bold leading-none -ml-0.5 -mt-1',
          variant === 'monochrome'
            ? 'text-white'
            : variant === 'dark'
            ? 'text-black'
            : 'text-[#FF91B5] drop-shadow-[0_0_8px_rgba(255,145,181,0.6)]',
          currentSize.sup
        )}
        style={{ verticalAlign: 'super', fontSize: '55%' }}
      >
        ²
      </sup>
    </div>
  );

  if (variant === 'icon') {
    return (
      <div className={clsx('relative flex items-center justify-center rounded-2xl bg-[#171722] border border-white/10 shadow-glass p-2.5', className)}>
        {renderMonogram()}
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className={clsx('inline-flex items-center space-x-2 select-none', className)}>
        {renderMonogram()}
        <span className="text-white/30 font-light text-sm">—</span>
        <span className={clsx('font-semibold tracking-[0.2em] text-white/90 uppercase', currentSize.heaven)}>
          HEAVEN
        </span>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={clsx('flex flex-col items-center select-none text-center', className)}>
        {renderMonogram()}
        <span className={clsx('font-medium tracking-[0.25em] text-white/80 uppercase mt-0.5', currentSize.heaven)}>
          HEAVEN
        </span>
        <span className={clsx('text-[#A7A7B7] tracking-wider italic font-serif opacity-80 mt-0.5', currentSize.sub)}>
          A Heaven Made for Two.
        </span>
      </div>
    );
  }

  // Primary Default
  return (
    <div className={clsx('inline-flex items-center select-none', className)}>
      {renderMonogram()}
    </div>
  );
};
