import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api, resolveMediaUrl } from '../../services/api';
import { notificationService } from '../../services/notifications';
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
  Camera,
  Upload,
  Globe,
  Radio,
  Heart,
  Edit3,
  Music,
  Bell,
  Play,
  Square,
  Trash2,
} from 'lucide-react';
import { ServerConfigModal } from '../../components/common/ServerConfigModal';
import { socketService, SocketConnectionState, getSocketUrl } from '../../services/socket';

export const ProfileView: React.FC = () => {
  const { user, partner, logout, updateProfile, updatePartnerNickname, lockApp } = useAuth();
  const { reduceMotion, setReduceMotion, soundEffects, setSoundEffects } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [isEditingPartner, setIsEditingPartner] = useState(false);
  const [partnerNicknameInput, setPartnerNicknameInput] = useState(partner?.nickname || '');
  const [partnerSuccessMsg, setPartnerSuccessMsg] = useState(false);

  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [socketState, setSocketState] = useState<SocketConnectionState>('disconnected');
  const [notificationEnabled, setNotificationEnabled] = useState(notificationService.isPermissionGranted());

  const [hasCustomRingtone, setHasCustomRingtone] = useState(Boolean(notificationService.getCustomRingtone()));
  const [hasCustomChime, setHasCustomChime] = useState(Boolean(notificationService.getCustomNotificationSound()));
  const [playingPreview, setPlayingPreview] = useState<'ringtone' | 'chime' | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const ringtoneFileInputRef = useRef<HTMLInputElement | null>(null);
  const chimeFileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleSavePartnerNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerNicknameInput.trim()) return;
    try {
      await updatePartnerNickname(partnerNicknameInput.trim());
      setPartnerSuccessMsg(true);
      setTimeout(() => {
        setPartnerSuccessMsg(false);
        setIsEditingPartner(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to update partner nickname:', err);
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

  const handleSelectRingtoneFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      notificationService.setCustomRingtone(dataUrl);
      setHasCustomRingtone(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectChimeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      notificationService.setCustomNotificationSound(dataUrl);
      setHasCustomChime(true);
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePreview = (type: 'ringtone' | 'chime') => {
    if (playingPreview === type) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      notificationService.stopCallRingtone();
      setPlayingPreview(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    notificationService.stopCallRingtone();

    if (type === 'ringtone') {
      const customRingtone = notificationService.getCustomRingtone();
      if (customRingtone) {
        const audio = new Audio(customRingtone);
        audio.volume = 1.0;
        audio.onended = () => setPlayingPreview(null);
        previewAudioRef.current = audio;
        audio.play().catch(() => {});
      } else {
        notificationService.startCallRingtone();
        setTimeout(() => {
          notificationService.stopCallRingtone();
          setPlayingPreview(null);
        }, 3000);
      }
      setPlayingPreview('ringtone');
    } else {
      notificationService.playMessageChime();
      setPlayingPreview('chime');
      setTimeout(() => setPlayingPreview(null), 1000);
    }
  };

  const handleResetRingtone = () => {
    notificationService.removeCustomRingtone();
    setHasCustomRingtone(false);
    if (playingPreview === 'ringtone') {
      handleTogglePreview('ringtone');
    }
  };

  const handleResetChime = () => {
    notificationService.removeCustomNotificationSound();
    setHasCustomChime(false);
    if (playingPreview === 'chime') {
      handleTogglePreview('chime');
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
            src={resolveMediaUrl(user?.avatarUrl, user?.name || 'Keerthi')}
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

      {/* 1b. Partner's Sacred Profile & Nickname Card */}
      <GlassCard className="p-4 border-white/10 relative overflow-hidden bg-gradient-to-br from-[#FF4F81]/15 via-[#9B5CFF]/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <img
                src={resolveMediaUrl(partner?.avatarUrl, partner?.name || 'Partner')}
                alt={partner?.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#FF4F81] shadow-glow-pink"
              />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#07070C] ${
                  partner?.presenceStatus === 'online' ? 'bg-[#42D392]' : 'bg-white/40'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-white">{partner?.name || 'Partner'}</span>
                <Heart className="w-3 h-3 text-[#FF4F81] fill-[#FF4F81]" />
              </div>
              <p className="text-sm font-semibold text-[#FF91B5] tracking-wide mt-0.5">
                {partner?.nickname || 'Love'}
              </p>
              <p className="text-[10px] text-white/50 italic max-w-[170px] truncate">
                {partner?.bio || 'My heart, my home...'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setPartnerNicknameInput(partner?.nickname || '');
              setIsEditingPartner(true);
            }}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#FF4F81]/25 to-[#9B5CFF]/25 border border-[#FF4F81]/40 hover:border-[#FF4F81] text-xs text-white font-semibold flex items-center space-x-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#FF91B5]" />
            <span>Edit Nickname</span>
          </button>
        </div>
      </GlassCard>

      {/* Hidden File Inputs for Audio Uploads */}
      <input
        type="file"
        ref={ringtoneFileInputRef}
        accept="audio/*"
        onChange={handleSelectRingtoneFile}
        className="hidden"
      />
      <input
        type="file"
        ref={chimeFileInputRef}
        accept="audio/*"
        onChange={handleSelectChimeFile}
        className="hidden"
      />

      {/* 2. Ringtones & Audio Sounds Customization */}
      <div>
        <h3 className="text-xs font-semibold text-[#A7A7B7] uppercase tracking-wider mb-2 px-1">
          Ringtones & Audio Sounds
        </h3>

        <GlassCard className="p-3 border-white/10 space-y-3">
          {/* Custom Call Ringtone */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9B5CFF]/20 to-[#FF4F81]/20 border border-[#FF4F81]/30 flex items-center justify-center text-[#FF91B5]">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Call Ringtone</span>
                <p className="text-[10px] text-[#A7A7B7]">
                  {hasCustomRingtone ? 'Custom audio file active' : 'Default Romantic Melody'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleTogglePreview('ringtone')}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white"
                title="Preview Ringtone"
              >
                {playingPreview === 'ringtone' ? (
                  <Square className="w-3.5 h-3.5 text-[#FF4F81] fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => ringtoneFileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#9B5CFF]/25 to-[#FF4F81]/25 border border-[#FF4F81]/30 text-[11px] text-[#FF91B5] font-medium hover:border-[#FF4F81]"
              >
                {hasCustomRingtone ? 'Change' : 'Choose File'}
              </button>
              {hasCustomRingtone && (
                <button
                  type="button"
                  onClick={handleResetRingtone}
                  className="p-1.5 rounded-lg bg-[#FF5570]/10 border border-[#FF5570]/20 text-[#FF5570] hover:bg-[#FF5570]/20"
                  title="Reset to default"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Custom Message Notification Chime */}
          <div className="flex items-center justify-between py-1 border-t border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#42D392]/20 to-[#9B5CFF]/20 border border-[#42D392]/30 flex items-center justify-center text-[#42D392]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Message Tone</span>
                <p className="text-[10px] text-[#A7A7B7]">
                  {hasCustomChime ? 'Custom audio file active' : 'Default Romantic Chime'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleTogglePreview('chime')}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white"
                title="Preview Chime"
              >
                {playingPreview === 'chime' ? (
                  <Square className="w-3.5 h-3.5 text-[#42D392] fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => chimeFileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#42D392]/25 to-[#9B5CFF]/25 border border-[#42D392]/30 text-[11px] text-[#42D392] font-medium hover:border-[#42D392]"
              >
                {hasCustomChime ? 'Change' : 'Choose File'}
              </button>
              {hasCustomChime && (
                <button
                  type="button"
                  onClick={handleResetChime}
                  className="p-1.5 rounded-lg bg-[#FF5570]/10 border border-[#FF5570]/20 text-[#FF5570] hover:bg-[#FF5570]/20"
                  title="Reset to default"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between py-1 border-t border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#42D392]">
                {soundEffects ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Romantic Audio Cues</span>
                <p className="text-[10px] text-[#A7A7B7]">Subtle tones for interactions</p>
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
                <p className="text-[10px] text-[#A7A7B7]">Require PIN immediately</p>
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
                <p className="text-[10px] text-[#A7A7B7]">App Lock Security (Default: 1530)</p>
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

      {/* 5. Lockscreen & Push Notifications */}
      <div>
        <h3 className="text-xs font-semibold text-[#A7A7B7] uppercase tracking-wider mb-2 px-1">
          Notifications & Alerts
        </h3>

        <GlassCard className="p-3.5 border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#FF4F81]/15 border border-[#FF4F81]/30 flex items-center justify-center text-[#FF4F81]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Lockscreen & Call Alerts</h4>
              <p className="text-[10px] text-[#A7A7B7]">Alert calls & messages even when app is closed</p>
            </div>
          </div>

          <button
            onClick={async () => {
              const granted = await notificationService.requestPermission();
              setNotificationEnabled(granted);
              if (granted) {
                notificationService.playMessageChime();
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              notificationEnabled
                ? 'bg-[#42D392]/20 border border-[#42D392]/40 text-[#42D392]'
                : 'bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white shadow-glow-pink'
            }`}
          >
            {notificationEnabled ? '✓ Enabled' : 'Enable'}
          </button>
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

      {/* Edit Partner's Nickname Modal */}
      <AnimatePresence>
        {isEditingPartner && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-3xl p-6 w-full max-w-sm border border-[#FF4F81]/30 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FF4F81]/20 flex items-center justify-center text-[#FF4F81]">
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Partner's Nickname</h3>
                    <p className="text-[10px] text-[#A7A7B7]">Set what you call {partner?.name || 'your love'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingPartner(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {partnerSuccessMsg ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#42D392]/20 border border-[#42D392]/40 text-[#42D392] mx-auto flex items-center justify-center animate-bounce">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-white">Nickname Updated! ❤️</p>
                  <p className="text-xs text-[#A7A7B7]">Saved as "{partnerNicknameInput}" across our Heaven.</p>
                </div>
              ) : (
                <form onSubmit={handleSavePartnerNickname} className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-[#A7A7B7] mb-1.5 font-medium">
                      Romantic Nickname for {partner?.name || 'Partner'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. My Queen, Anu, Babu, Sweetheart"
                      value={partnerNicknameInput}
                      onChange={(e) => setPartnerNicknameInput(e.target.value)}
                      className="w-full bg-[#101019] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF4F81] transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Quick Preset Nicknames */}
                  <div>
                    <span className="block text-[10px] text-white/50 uppercase tracking-wider mb-2">
                      {partner?.name?.toLowerCase().includes('keerthi') || user?.name?.toLowerCase().includes('anu')
                        ? 'Boyfriend Nicknames (Tap to select):'
                        : 'Girlfriend Nicknames (Tap to select):'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(
                        partner?.name?.toLowerCase().includes('keerthi') || user?.name?.toLowerCase().includes('anu')
                          ? [
                              'My Love ❤️',
                              'Bubu 🥰',
                              'Handsome 😘',
                              'Kuttan 💕',
                              'My Person 🫶',
                            ]
                          : [
                              'My Love ❤️',
                              'Ponne 🥰',
                              'Bubu 💕',
                              'Princess 👑',
                              'My Girl 🫶',
                            ]
                      ).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setPartnerNicknameInput(preset)}
                          className={`px-3 py-1.5 rounded-xl text-xs transition-all font-medium ${
                            partnerNicknameInput === preset
                              ? 'bg-[#FF4F81] text-white shadow-glow-pink scale-105'
                              : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white font-semibold text-xs shadow-glow-pink hover:opacity-90 active:scale-95 transition-transform flex items-center justify-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Partner's Nickname</span>
                    </button>
                  </div>
                </form>
              )}
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
                  <label className="block text-[11px] text-[#A7A7B7] mb-1">Current PIN (Default: 1530)</label>
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
