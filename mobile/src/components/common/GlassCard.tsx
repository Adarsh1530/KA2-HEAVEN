import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  glowColor?: 'rose' | 'violet' | 'none';
  interactive?: boolean;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  glowColor = 'none',
  interactive = false,
  className,
  ...props
}) => {
  const glowStyles = {
    none: '',
    rose: 'hover:border-[#FF4F81]/40 hover:shadow-[0_0_20px_rgba(255,79,129,0.2)]',
    violet: 'hover:border-[#9B5CFF]/40 hover:shadow-[0_0_20px_rgba(155,92,255,0.2)]',
  };

  return (
    <motion.div
      whileTap={interactive ? { scale: 0.98 } : undefined}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={clsx(
        'glass-panel rounded-2xl p-4 transition-all duration-300 relative overflow-hidden backdrop-blur-xl',
        interactive && 'cursor-pointer active:opacity-95',
        glowStyles[glowColor],
        className
      )}
      {...props}
    >
      {/* Subtle Top Edge Reflection */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
};
