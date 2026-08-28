import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '@ka2/shared';

interface StartupAnimationProps {
  onComplete: () => void;
}

export const StartupAnimation: React.FC<StartupAnimationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Stage 1: Particles appear & orbit (0 - 800ms)
    const t1 = setTimeout(() => setStep(1), 400);
    // Stage 2: Convergence & light burst (800 - 1300ms)
    const t2 = setTimeout(() => setStep(2), 1000);
    // Stage 3: Monogram & Brand reveal (1300 - 2400ms)
    const t3 = setTimeout(() => setStep(3), 1500);
    // Complete & transition (2600ms)
    const t4 = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 z-50 bg-[#07070C] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
    >
      {/* Background Star Ambient Dust */}
      <div className="absolute inset-0 bg-radial-gradient from-[#171722]/40 via-[#07070C] to-[#07070C]" />

      {/* Orbiting Relationship Particles (Stages 0 - 2) */}
      {step < 3 && (
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Particle 1: Keerthi (Violet Glow) */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: step === 2 ? 0 : [30, -30, 30],
              y: step === 2 ? 0 : [-30, 30, -30],
            }}
            transition={{
              x: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: 0.3 },
            }}
            className="absolute w-4 h-4 rounded-full bg-[#9B5CFF] shadow-[0_0_20px_#9B5CFF]"
          />

          {/* Particle 2: Anu (Rose Pink Glow) */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: step >= 1 ? 1 : 0,
              scale: step >= 1 ? 1 : 0,
              x: step === 2 ? 0 : [-30, 30, -30],
              y: step === 2 ? 0 : [30, -30, 30],
            }}
            transition={{
              x: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: 0.3 },
            }}
            className="absolute w-4 h-4 rounded-full bg-[#FF4F81] shadow-[0_0_20px_#FF4F81]"
          />

          {/* Soft Light Burst on Collision (Stage 2) */}
          <AnimatePresence>
            {step === 2 && (
              <motion.div
                initial={{ scale: 0, opacity: 0.9 }}
                animate={{ scale: 3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-[#9B5CFF] via-[#FF4F81] to-[#FF91B5] blur-xl"
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Brand Materialization (Stage 3) */}
      {step >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center text-center relative z-10"
        >
          {/* Glowing Aura */}
          <div className="absolute -inset-10 bg-gradient-to-r from-[#9B5CFF]/20 via-[#FF4F81]/25 to-[#FF91B5]/20 blur-2xl rounded-full" />

          {/* KA² Letters Reveal */}
          <div className="flex items-start select-none">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-6xl font-black tracking-tight bg-gradient-to-br from-[#B28CFF] to-[#FF4F81] bg-clip-text text-transparent"
            >
              K
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-6xl font-black tracking-tight bg-gradient-to-br from-[#FF4F81] to-[#FF91B5] bg-clip-text text-transparent"
            >
              A
            </motion.span>
            <motion.sup
              initial={{ opacity: 0, scale: 0, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.3, type: 'spring', stiffness: 300 }}
              className="text-3xl font-black text-[#FF91B5] drop-shadow-[0_0_12px_rgba(255,145,181,0.8)] -mt-2 ml-0.5"
            >
              ²
            </motion.sup>
          </div>

          {/* HEAVEN Wordmark */}
          <motion.div
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={{ opacity: 0.9, letterSpacing: '0.3em' }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="text-sm font-semibold uppercase text-white/90 mt-2"
          >
            HEAVEN
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="text-xs text-[#A7A7B7] italic font-serif mt-3 tracking-wide"
          >
            {BRAND.PRIMARY_TAGLINE}
          </motion.div>
        </motion.div>
      )}

      {/* Skip indicator for quick entry */}
      <div className="absolute bottom-6 text-[10px] text-white/30 tracking-widest uppercase">
        Tap anywhere to enter
      </div>
    </div>
  );
};
