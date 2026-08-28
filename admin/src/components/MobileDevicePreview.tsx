import React from 'react';
import { AppSettings } from '@ka2/shared';
import { Heart, MessageCircle, Phone, Video, Lock, Sparkles, Send } from 'lucide-react';

interface MobileDevicePreviewProps {
  settings: AppSettings;
  previewScreen?: 'home' | 'chat' | 'vault';
}

export const MobileDevicePreview: React.FC<MobileDevicePreviewProps> = ({
  settings,
  previewScreen = 'home',
}) => {
  return (
    <div className="w-[340px] h-[680px] bg-black rounded-[48px] p-3 shadow-2xl border-4 border-white/20 relative flex flex-col justify-between overflow-hidden select-none">
      {/* Device Dynamic Island / Speaker Notch */}
      <div className="absolute top-4 inset-x-0 mx-auto w-24 h-5 bg-black rounded-full z-30 flex items-center justify-center border border-white/10">
        <div className="w-2.5 h-2.5 rounded-full bg-[#171722] mr-2" />
        <div className="w-2 h-2 rounded-full bg-[#9B5CFF]/60" />
      </div>

      {/* Screen Container */}
      <div
        className="w-full h-full rounded-[40px] overflow-hidden flex flex-col justify-between relative pt-8 pb-3 px-3.5 transition-colors duration-300"
        style={{
          backgroundColor: settings.themeMode === 'light' ? '#FAF7FA' : '#07070C',
          color: settings.themeMode === 'light' ? '#151520' : '#FFFFFF',
        }}
      >
        {/* Mock Top Header */}
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <div className="flex items-center space-x-1.5">
            <span
              className="text-sm font-extrabold tracking-tight"
              style={{
                background: `linear-gradient(135deg, ${settings.secondaryColor}, ${settings.primaryColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {settings.shortBrandMark || 'KA²'}
            </span>
            <span className="text-[9px] font-bold tracking-widest uppercase opacity-80">
              HEAVEN
            </span>
          </div>
          <span className="text-[9px] opacity-60">100% 🔒</span>
        </div>

        {/* Dynamic Screen View Preview */}
        {previewScreen === 'home' && (
          <div className="flex-1 py-3 flex flex-col space-y-3">
            {/* Greeting */}
            <div>
              <h4 className="text-xs font-bold truncate">Welcome back, Keerthi ❤️</h4>
              <p className="text-[9px] opacity-70 italic">{settings.tagline}</p>
            </div>

            {/* 3D Particle Scene Preview Box */}
            <div
              className="h-32 rounded-2xl relative flex flex-col items-center justify-center p-3 text-center border border-white/10 overflow-hidden"
              style={{
                background: 'rgba(23, 23, 34, 0.75)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                className="w-16 h-16 rounded-full blur-lg opacity-40 absolute"
                style={{
                  background: `linear-gradient(135deg, ${settings.secondaryColor}, ${settings.primaryColor})`,
                }}
              />
              <div className="flex items-center space-x-4 relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60"
                  alt="Keerthi"
                  className="w-9 h-9 rounded-full object-cover border"
                  style={{ borderColor: settings.secondaryColor }}
                />
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-pulse"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <Heart className="w-3 h-3 text-white fill-current" />
                </div>
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60"
                  alt="Anu"
                  className="w-9 h-9 rounded-full object-cover border"
                  style={{ borderColor: settings.primaryColor }}
                />
              </div>
              <span className="text-[8px] font-semibold tracking-wider uppercase mt-2 opacity-80">
                Our Private Orbit
              </span>
            </div>

            {/* Quick Action Tiles */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" style={{ color: settings.primaryColor }} />
                <div>
                  <span className="text-[10px] font-bold block">Chat</span>
                  <span className="text-[8px] opacity-60">Talk to her</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center space-x-2">
                <Phone className="w-4 h-4 text-[#42D392]" />
                <div>
                  <span className="text-[10px] font-bold block">Voice</span>
                  <span className="text-[8px] opacity-60">Call Anu</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {previewScreen === 'chat' && (
          <div className="flex-1 py-2 flex flex-col justify-between">
            <div className="space-y-2 text-[10px]">
              <div className="p-2 rounded-xl bg-white/10 max-w-[80%] rounded-bl-none">
                <span>Welcome to our private Heaven, my love! ❤️</span>
              </div>
              <div
                className="p-2 rounded-xl text-white max-w-[80%] ml-auto rounded-br-none"
                style={{
                  background: `linear-gradient(135deg, ${settings.secondaryColor}, ${settings.primaryColor})`,
                }}
              >
                <span>A heaven made for two... I love you! ✨</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[10px] opacity-70">
              <span>Send a message...</span>
              <Send className="w-3.5 h-3.5" style={{ color: settings.primaryColor }} />
            </div>
          </div>
        )}

        {/* Mock Bottom Navigation */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-around text-[9px] opacity-80">
          <span style={{ color: settings.primaryColor, fontWeight: 'bold' }}>Home</span>
          <span>Chat</span>
          <span>Memories</span>
          <span>Vault</span>
        </div>
      </div>
    </div>
  );
};
