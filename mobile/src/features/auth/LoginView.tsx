import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '../../components/brand/Logo';
import { useAuth } from '../../context/AuthContext';
import { BRAND } from '@ka2/shared';
import { Lock, Mail, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('iloveyouanu@gmail.com');
  const [password, setPassword] = useState('30052003');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickSwitch = (target: 'keerthi' | 'anu') => {
    if (target === 'keerthi') {
      setEmail('iloveyouanu@gmail.com');
      setPassword('30052003');
    } else {
      setEmail('iloveyoukeerthi@gmail.com');
      setPassword('15022003');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password, navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#07070C] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Ambient glowing orbs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-[#9B5CFF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-[#FF4F81]/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-sm z-10"
      >
        {/* Logo Monogram */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Logo variant="full" size="xl" />
        </div>

        {/* Quick Profile Selection */}
        <div className="flex items-center justify-center space-x-3 mb-6">
          <button
            type="button"
            onClick={() => handleQuickSwitch('keerthi')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              email.includes('keerthi')
                ? 'bg-gradient-to-r from-[#9B5CFF]/30 to-[#FF4F81]/30 border-[#FF4F81] text-white shadow-glow-pink'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <span>👑 Keerthi (Admin)</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickSwitch('anu')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              email.includes('anu')
                ? 'bg-gradient-to-r from-[#FF4F81]/30 to-[#FF91B5]/30 border-[#FF4F81] text-white shadow-glow-pink'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <span>❤️ Anu Sri</span>
          </button>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
          <h2 className="text-sm font-semibold text-white/90 mb-4 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#42D392]" />
            <span>Private Couple Authentication</span>
          </h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-[#FF5570]/15 border border-[#FF5570]/30 text-[#FF5570] text-xs rounded-xl p-3 mb-4"
            >
              {error}
            </motion.div>
          )}

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-[11px] font-medium text-[#A7A7B7] mb-1">
              Private ID / Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@ka2heaven.local"
                className="w-full bg-[#101019]/80 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF4F81] focus:ring-1 focus:ring-[#FF4F81]"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label className="block text-[11px] font-medium text-[#A7A7B7] mb-1">
              Secret Passphrase
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full bg-[#101019]/80 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF4F81] focus:ring-1 focus:ring-[#FF4F81]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9B5CFF] via-[#FF4F81] to-[#FF91B5] text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-glow-pink hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Our Heaven</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center text-[10px] text-white/40 mt-6 tracking-wide">
          End-to-End Encrypted • Private Two-Person World • Zero Public Access
        </p>
      </motion.div>
    </div>
  );
};
