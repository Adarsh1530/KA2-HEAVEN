import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { GlassCard } from '../../components/common/GlassCard';
import { Logo } from '../../components/brand/Logo';
import { DeviceSession, BRAND } from '@ka2/shared';
import {
  User,
  Shield,
  Moon,
  Sun,
  Lock,
  Smartphone,
  LogOut,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  KeyRound,
  Check,
  X,
  ExternalLink,
  Fingerprint,
  Camera,
  Upload,
  Globe,
  Radio,
} from 'lucide-react';
import { ServerConfigModal } from '../../components/common/ServerConfigModal';
import { socketService, SocketConnectionState, getSocketUrl } from '../../services/socket';

export const ProfileView: React.FC = () => {
  const { user, partner, logout, updateProfile, lockApp } = useAuth();
  const { theme, toggleTheme, reduceMotion, setReduceMotion, soundEffects, setSoundEffects } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [socketState, setSocketState] = useState<SocketConnectionState>('disconnected');

  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = socketService.onStatusChange((state) => {
      setSocketState(state);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await api.request('/auth/sessions');
        setSessions(data.sessions);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      }
    };
    fetchSessions();
  }, []);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const uploadRes = await api.uploadMedia(file);
      setAvatarUrl(uploadRes.fileUrl);
      // Auto-save avatar to profile
      await updateProfile({ avatarUrl: uploadRes.fileUrl });
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ name, nickname, bio, avatarUrl });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/auth/pin/change', {
        method: 'PUT',
        body: JSON.stringify({ currentPin, newPin }),
      });
      setPinMessage({ type: 'success', text: 'PIN updated successfully.' });
      setCurrentPin('');
      setNewPin('');
      setTimeout(() => {
        setIsChangingPin(false);
        setPinMessage(null);
      }, 1500);
    } catch (err: any) {
      setPinMessage({ type: 'error', text: err.message || 'Failed to update PIN.' });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.request(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Failed to revoke session:', err);
    }
  };

  return (
    <div className="flex flex-col space-y-4 pb-24 px-4 pt-3 select-none">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={avatarFileInputRef}
        accept="image/*"
        onChange={handleAvatarFileSelect}
        className="hidden"
      />

      {/* 1. Profile Hero Card */}
      <GlassCard className="p-5 border-white/10 text-center relative shadow-xl">
        {/* Interactive Avatar with Camera Upload Badge */}
        <div
          onClick={() => avatarFileInputRef.current?.click()}
          className="relative w-20 h-20 mx-auto mb-3 cursor-pointer group"
          title="Tap to change avatar from gallery"
        >
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
            alt={user?.name}
            className="w-full h-full rounded-full object-cover border-2 border-[#9B5CFF] shadow-[0_0_20px_rgba(155,92,255,0.4)] group-hover:opacity-80 transition-opacity"
          />

          {/* Uploading Spinner or Camera Badge */}
          {isUploadingAvatar ? (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Camera className="w-5 h-5" />
            </div>
          )}

          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#FF4F81] border-2 border-[#07070C] flex items-center justify-center text-white shadow-md">
            <Camera className="w-3 h-3" />
          </span>
        </div>

        <h2 className="text-lg font-bold text-white flex items-center justify-center space-x-1.5">
          <span>{user?.name}</span>
          {user?.role === 'admin' && <span title="Administrator">👑</span>}
        </h2>
        <p className="text-xs text-[#FF91B5] font-medium">{user?.nickname || 'Love'}</p>
        <p className="text-xs text-white/70 italic mt-2 max-w-xs mx-auto leading-relaxed">
          "{user?.bio || 'In our private digital heaven ❤️'}"
        </p>

        <div className="flex items-center justify-center space-x-2 mt-3">
          <button
            onClick={() => {
              setName(user?.name || '');
              setNickname(user?.nickname || '');
              setBio(user?.bio || '');
              setAvatarUrl(user?.avatarUrl || '');
              setIsEditing(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 hover:text-white font-medium transition-colors"
          >
            Edit Profile
          </button>
          <button
            onClick={() => avatarFileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#9B5CFF]/30 to-[#FF4F81]/30 border border-[#FF4F81]/40 text-xs text-white font-medium flex items-center space-x-1.5 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#FF91B5]" />
            <span>Change Photo</span>
          </button>
        </div>
      </GlassCard>

      {/* 2. Theme & Motion Customization */}
      <div>
        <h3 className="text-xs font-semibold text-[#A7A7B7] uppercase tracking-wider mb-2 px-1">
          Experience & Atmosphere
        </h3>

        <GlassCard className="p-3 border-white/10 space-y-3">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#FF91B5]">
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Theme Atmosphere</span>
                <p className="text-[10px] text-[#A7A7B7]">
                  {theme === 'dark' ? 'Dark Romantic Luxury' : 'Light Heaven'}
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/90 hover:bg-white/10"
            >
              {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>

          {/* Reduce Motion Toggle */}
          <div className="flex items-center justify-between py-1 border-t border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#9B5CFF]">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Reduce Motion</span>
                <p className="text-[10px] text-[#A7A7B7]">Disables 3D particles & animations</p>
              </div>
            </div>

            <button
              onClick={() => setReduceMotion(!reduceMotion)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                reduceMotion ? 'bg-[#FF4F81]' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  reduceMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between py-1 border-t border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#42D392]">
                {soundEffects ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Romantic Audio Cues</span>
                <p className="text-[10px] text-[#A7A7B7]">Subtle tones for calls & messages</p>
              </div>
            </div>

            <button
              onClick={() => setSoundEffects(!soundEffects)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                soundEffects ? 'bg-[#42D392]' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  soundEffects ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </GlassCard>
      </div>

      {/* 3. Security & App Lock */}
      <div>
        <h3 className="text-xs font-semibold text-[#A7A7B7] uppercase tracking-wider mb-2 px-1">
          Security & Privacy
        </h3>

        <GlassCard className="p-3 border-white/10 space-y-3">
          {/* Lock App Now */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#FF5570]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Instant App Lock</span>
                <p className="text-[10px] text-[#A7A7B7]">Require PIN or Biometrics immediately</p>
              </div>
            </div>

            <button
              onClick={lockApp}
              className="px-3 py-1.5 rounded-xl bg-[#FF5570]/20 border border-[#FF5570]/30 text-xs text-[#FF5570] font-semibold hover:bg-[#FF5570]/30"
            >
              Lock Now
            </button>
          </div>

          {/* Change Security PIN */}
          <div className="flex items-center justify-between py-1 border-t border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#FF91B5]">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Change Security PIN</span>
                <p className="text-[10px] text-[#A7A7B7]">For Vault and App Lock</p>
              </div>
            </div>

            <button
              onClick={() => setIsChangingPin(true)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10"
            >
              Update PIN
            </button>
          </div>
        </GlassCard>
      </div>

      {/* 4. Cloud Server & Global Internet Sync */}
      <div>
        <h3 className="text-xs font-semibold text-[#A7A7B7] uppercase tracking-wider mb-2 px-1">
          Cloud Server & Internet Sync
        </h3>

        <GlassCard className="p-3.5 border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                socketState === 'connected' ? 'bg-[#42D392]/15 text-[#42D392]' : 'bg-[#FF5570]/15 text-[#FF5570]'
              }`}>
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white flex items-center space-x-1.5">
                  <span>Cloud Connection</span>
                  <span className={`w-2 h-2 rounded-full ${
                    socketState === 'connected' ? 'bg-[#42D392] animate-pulse' : 'bg-[#FF5570]'
                  }`} />
                </span>
                <p className="text-[10px] text-[#A7A7B7]">
                  {socketState === 'connected' ? 'Realtime Chat & Calls Active' : 'Offline / Local Fallback'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsServerModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/90 hover:bg-white/10 transition-colors"
            >
              Configure
            </button>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-[#A7A7B7]">
            <span>Active Server:</span>
            <span className="font-mono text-white/70 max-w-[200px] truncate">
              {getSocketUrl()}
            </span>
          </div>
        </GlassCard>
      </div>

      {/* 5. Active Device Sessions */}
      <div>
        <h3 className="text-xs font-semibold text-[#A7A7B7] uppercase tracking-wider mb-2 px-1">
          Authorized Devices
        </h3>

        <GlassCard className="p-3 border-white/10 space-y-2.5">
          {sessions.map((sess) => (
            <div key={sess.id} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
              <div className="flex items-center space-x-2.5">
                <Smartphone className="w-4 h-4 text-[#B28CFF]" />
                <div>
                  <span className="text-xs font-semibold text-white">{sess.deviceName}</span>
                  <p className="text-[9px] text-[#A7A7B7]">{sess.ipAddress} • {sess.deviceType}</p>
                </div>
              </div>
              <button
                onClick={() => handleRevokeSession(sess.id)}
                className="text-[10px] text-[#FF5570] hover:underline"
              >
                Revoke
              </button>
            </div>
          ))}
        </GlassCard>
      </div>

      {/* 5. Admin Dashboard Link (if Admin) */}
      {user?.role === 'admin' && (
        <a
          href={
            import.meta.env.VITE_ADMIN_URL ||
            (typeof window !== 'undefined' && window.location.port === '5173'
              ? `http://${window.location.hostname || 'localhost'}:5174`
              : '/admin')
          }
          target="_blank"
          rel="noreferrer"
          className="glass-panel p-4 rounded-2xl border border-[#9B5CFF]/40 bg-gradient-to-r from-[#9B5CFF]/15 to-[#FF4F81]/15 flex items-center justify-between hover:border-[#FF4F81] transition-all cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">👑</span>
            <div>
              <h3 className="text-xs font-bold text-white">Open Admin Console</h3>
              <p className="text-[10px] text-[#A7A7B7]">Live Theme Customizer, System Health & Storage</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-[#FF4F81]" />
        </a>
      )}

      {/* 6. Sign Out Button */}
      <button
        onClick={logout}
        className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-[#FF5570] font-semibold text-xs flex items-center justify-center space-x-2 hover:bg-[#FF5570]/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out of Our Heaven</span>
      </button>

      {/* App Footer Brand */}
      <div className="text-center pt-2">
        <Logo variant="full" size="sm" />
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-3xl p-6 w-full max-w-sm border border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Edit Profile</h3>
                <button onClick={() => setIsEditing(false)}>
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Direct Photo Upload Picker */}
                <div className="flex flex-col items-center">
                  <div
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#FF4F81] cursor-pointer group shadow-glow-pink mb-2"
                  >
                    <img
                      src={avatarUrl || user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                      alt="Avatar"
                      className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="text-xs text-[#FF91B5] font-semibold hover:underline flex items-center space-x-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose from Gallery / Files</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1">Romantic Nickname</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1">Bio / Romantic Whisper</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white font-semibold text-xs shadow-glow-pink hover:opacity-90"
                >
                  Save Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change PIN Modal */}
      <AnimatePresence>
        {isChangingPin && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-3xl p-6 w-full max-w-sm border border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Update Security PIN</h3>
                <button onClick={() => setIsChangingPin(false)}>
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </button>
              </div>

              {pinMessage && (
                <div className={`p-2.5 rounded-xl text-xs mb-3 ${
                  pinMessage.type === 'success' ? 'bg-[#42D392]/20 text-[#42D392]' : 'bg-[#FF5570]/20 text-[#FF5570]'
                }`}>
                  {pinMessage.text}
                </div>
              )}

              <form onSubmit={handleChangePinSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1">Current PIN (Default: 2808)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81] tracking-widest text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1">New 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81] tracking-widest text-center"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white font-semibold text-xs shadow-glow-pink"
                >
                  Save New PIN
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cloud Server Configuration Modal */}
      <ServerConfigModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
      />
    </div>
  );
};
