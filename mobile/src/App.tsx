import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CallProvider } from './context/CallContext';
import { StartupAnimation } from './components/brand/StartupAnimation';
import { TopHeader } from './components/common/TopHeader';
import { BottomNav, NavTab } from './components/common/BottomNav';
import { LoginView } from './features/auth/LoginView';
import { PinLockModal } from './features/auth/PinLockModal';
import { HomeView } from './features/home/HomeView';
import { ChatView } from './features/chat/ChatView';
import { MemoriesView } from './features/memories/MemoriesView';
import { ProfileView } from './features/profile/ProfileView';
import { LoveNotesView } from './features/love_notes/LoveNotesView';
import { StoryView } from './features/story/StoryView';
import { CallOverlay } from './features/calls/CallOverlay';

const AppContent: React.FC = () => {
  const { user, isLoading, isLocked } = useAuth();
  const [showStartup, setShowStartup] = useState(() => {
    // Show startup animation on fresh launch
    return !sessionStorage.getItem('ka2_startup_shown');
  });
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [subView, setSubView] = useState<'none' | 'love_notes' | 'story'>('none');

  const handleStartupComplete = () => {
    setShowStartup(false);
    sessionStorage.setItem('ka2_startup_shown', 'true');
  };

  if (showStartup) {
    return <StartupAnimation onComplete={handleStartupComplete} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07070C] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-3 border-[#FF4F81] border-t-transparent rounded-full animate-spin shadow-glow-pink" />
        <span className="text-xs font-semibold tracking-widest text-[#FF91B5] uppercase">
          Opening Our Heaven...
        </span>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[var(--primary-bg)] text-[var(--text-main)] flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl border-x border-white/5 transition-colors duration-300">
      {/* App Security PIN Lock Screen */}
      <PinLockModal isOpen={isLocked} />

      {/* Global WebRTC Voice/Video Call Overlay */}
      <CallOverlay />

      {/* App Top Navigation Bar */}
      <TopHeader onOpenStory={() => setSubView('story')} />

      {/* Main Content Router */}
      <main className="flex-1 overflow-y-auto">
        {subView === 'love_notes' ? (
          <LoveNotesView onBack={() => setSubView('none')} />
        ) : subView === 'story' ? (
          <StoryView onBack={() => setSubView('none')} />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                onNavigate={(tab) => {
                  setSubView('none');
                  setActiveTab(tab);
                }}
                onOpenLoveNotes={() => setSubView('love_notes')}
                onOpenStory={() => setSubView('story')}
              />
            )}
            {activeTab === 'chat' && <ChatView />}
            {activeTab === 'memories' && <MemoriesView />}
            {activeTab === 'settings' && <ProfileView />}
          </>
        )}
      </main>

      {/* Fixed Bottom Tab Navigation */}
      {subView === 'none' && (
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setSubView('none');
            setActiveTab(tab);
          }}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CallProvider>
          <AppContent />
        </CallProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
