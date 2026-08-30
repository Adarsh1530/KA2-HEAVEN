import React, { useState, useEffect } from 'react';
import { Logo } from '../brand/Logo';
import { useAuth } from '../../context/AuthContext';
import { socketService, SocketConnectionState } from '../../services/socket';
import { ServerConfigModal } from './ServerConfigModal';
import { Lock, Globe } from 'lucide-react';

interface TopHeaderProps {
  onOpenStory?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenStory }) => {
  const { lockApp } = useAuth();
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [socketState, setSocketState] = useState<SocketConnectionState>('disconnected');

  useEffect(() => {
    const unsub = socketService.onStatusChange((state) => {
      setSocketState(state);
    });
    return unsub;
  }, []);

  return (
    <>
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
          {/* Cloud Server Connectivity Status Indicator */}
          <button
            onClick={() => setIsServerModalOpen(true)}
            title={
              socketState === 'connected'
                ? 'Cloud Connected (Tap to configure)'
                : socketState === 'connecting'
                ? 'Connecting to Cloud...'
                : 'Server Offline (Tap to setup Cloud Server)'
            }
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center space-x-1.5 border transition-all ${
              socketState === 'connected'
                ? 'bg-[#42D392]/10 border-[#42D392]/30 text-[#42D392]'
                : socketState === 'connecting'
                ? 'bg-[#FFB800]/10 border-[#FFB800]/30 text-[#FFB800]'
                : 'bg-[#FF5570]/10 border-[#FF5570]/30 text-[#FF5570]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                socketState === 'connected'
                  ? 'bg-[#42D392] animate-pulse'
                  : socketState === 'connecting'
                  ? 'bg-[#FFB800] animate-ping'
                  : 'bg-[#FF5570]'
              }`}
            />
            <span className="text-[9px] font-mono">
              {socketState === 'connected' ? 'Cloud' : socketState === 'connecting' ? 'Sync' : 'Offline'}
            </span>
            <Globe className="w-3 h-3 ml-0.5 opacity-80" />
          </button>

          {/* Lock App Immediately */}
          <button
            onClick={lockApp}
            title="Lock App"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#FF4F81] hover:bg-[#FF4F81]/10 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Cloud Server Config Modal */}
      <ServerConfigModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
      />
    </>
  );
};
