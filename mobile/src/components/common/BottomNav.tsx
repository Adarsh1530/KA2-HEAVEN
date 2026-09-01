import React from 'react';
import { motion } from 'framer-motion';
import { Home, MessageCircle, Heart, Lock, Settings, Sparkles } from 'lucide-react';
import clsx from 'clsx';

export type NavTab = 'home' | 'chat' | 'memories' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  unreadCount = 0,
}) => {
  const tabs = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'chat' as const, label: 'Chat', icon: MessageCircle, badge: unreadCount },
    { id: 'memories' as const, label: 'Memories', icon: Heart },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 glass-panel border-t border-white/10 safe-bottom backdrop-blur-2xl px-2 py-1.5">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={clsx(
                'relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 transition-all duration-300 select-none',
                isActive ? 'text-[#FF4F81]' : 'text-[#A7A7B7] hover:text-white/80'
              )}
            >
              {/* Active Tab Glow Bubble */}
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-gradient-to-t from-[#FF4F81]/15 to-transparent rounded-xl"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon className={clsx('w-5 h-5 transition-transform duration-200', isActive && 'scale-110')} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#FF4F81] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-glow-pink">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={clsx('text-[10px] mt-1 font-medium tracking-tight', isActive ? 'text-white font-semibold' : 'text-[#A7A7B7]')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
