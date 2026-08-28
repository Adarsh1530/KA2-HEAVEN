import React from 'react';
import { Logo } from '../brand/Logo';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { Phone, Video, Lock, ShieldCheck } from 'lucide-react';

interface TopHeaderProps {
  onOpenStory?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenStory }) => {
  const { user, partner, lockApp } = useAuth();
  const { startCall } = useCall();

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/5 safe-top px-4 py-3 flex items-center justify-between backdrop-blur-2xl">
      {/* Brand Monogram */}
      <div className="flex items-center space-x-2">
        <Logo variant="primary" size="md" />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-[0.25em] text-white/80 uppercase leading-none">
            HEAVEN
          </span>
          <span className="text-[8px] text-[#FF91B5] font-medium tracking-wide">
            Where It’s Just Us. ❤️
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Quick Voice Call */}
        <button
          onClick={() => startCall('voice')}
          title="Voice Call"
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:text-[#42D392] hover:bg-[#42D392]/10 transition-colors"
        >
          <Phone className="w-4 h-4" />
        </button>

        {/* Quick Video Call */}
        <button
          onClick={() => startCall('video')}
          title="Video Call"
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:text-[#9B5CFF] hover:bg-[#9B5CFF]/10 transition-colors"
        >
          <Video className="w-4 h-4" />
        </button>

        {/* Lock App Immediately */}
        <button
          onClick={lockApp}
          title="Lock App"
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#FF4F81] hover:bg-[#FF4F81]/10 transition-colors ml-1"
        >
          <Lock className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
