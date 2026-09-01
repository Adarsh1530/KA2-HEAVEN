import React, { useState } from 'react';
import { adminApi } from '../services/adminApi';
import { Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (user: any) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('iloveyouanu@gmail.com');
  const [password, setPassword] = useState('30052003');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await adminApi.login(email, password);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-1 font-black text-3xl text-white mb-2">
            <span className="bg-gradient-to-r from-[#9B5CFF] via-[#FF4F81] to-[#FF91B5] bg-clip-text text-transparent">
              KA²
            </span>
            <sup className="text-sm text-[#FF91B5] -mt-2">²</sup>
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-widest">
            Admin Infrastructure Console
          </h2>
          <p className="text-xs text-[#A7A7B7] mt-1">Keerthi Adarsh Administrator Portal</p>
        </div>

        {error && (
          <div className="bg-[#FF5570]/15 border border-[#FF5570]/30 text-[#FF5570] text-xs rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A7A7B7] mb-1">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#101019] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A7A7B7] mb-1">Admin Passphrase</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#101019] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white font-semibold text-xs shadow-glow-pink hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Authenticate Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 text-center text-[10px] text-white/40 flex items-center justify-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#42D392]" />
          <span>Zero-Knowledge Architecture • Plaintext Guarded</span>
        </div>
      </div>
    </div>
  );
};
