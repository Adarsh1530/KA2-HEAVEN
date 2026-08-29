import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { UserProfile, PresenceStatus, AppSettings } from '@ka2/shared';

interface PartnerProfile {
  id: string;
  name: string;
  nickname: string;
  avatarUrl: string;
  bio?: string;
  presenceStatus: PresenceStatus;
  lastActive: string;
}

interface AuthContextType {
  user: UserProfile | null;
  partner: PartnerProfile | null;
  appSettings: AppSettings | null;
  isLoading: boolean;
  isLocked: boolean;
  bothOnline: boolean;
  login: (email: string, pass: string, deviceName?: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  lockApp: () => void;
  unlockApp: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [bothOnline, setBothOnline] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await api.request('/auth/me');
      setUser(data.user);
      setPartner(data.partner);
      setAppSettings(data.appSettings);
    } catch {
      setUser(null);
      setPartner(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = api.getAccessToken();
    if (token) {
      refreshProfile();
    } else {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  // Socket & Presence Listener
  useEffect(() => {
    if (!user) return;

    const socket = socketService.connect();
    if (!socket) return;

    const handlePresence = (data: { presence: Record<string, any>; bothOnline: boolean }) => {
      setBothOnline(data.bothOnline);
      if (partner && data.presence[partner.id]) {
        setPartner(prev => prev ? {
          ...prev,
          presenceStatus: data.presence[partner.id].presenceStatus,
          lastActive: data.presence[partner.id].lastActive,
        } : null);
      }
    };

    const handleConfigUpdate = (newSettings: AppSettings) => {
      setAppSettings(prev => ({ ...prev, ...newSettings }));
    };

    socket.on('presence:sync', handlePresence);
    socket.on('system:config_update', handleConfigUpdate);

    return () => {
      socket.off('presence:sync', handlePresence);
      socket.off('system:config_update', handleConfigUpdate);
    };
  }, [user, partner?.id]);

  const login = async (email: string, pass: string, deviceName = 'Mobile Device') => {
    const data = await api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, deviceName }),
    });

    api.setTokens(data.tokens.accessToken, data.tokens.refreshToken, data.user.id);
    setUser(data.user);
    await refreshProfile();
    socketService.connect();
  };

  const logout = async () => {
    try {
      await api.request('/auth/logout', { method: 'POST' });
    } catch {}
    api.clearTokens();
    socketService.disconnect();
    setUser(null);
    setPartner(null);
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    try {
      const res = await api.request('/auth/pin/verify', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      if (res.verified) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const lockApp = () => setIsLocked(true);
  const unlockApp = () => setIsLocked(false);

  const updateProfile = async (updateData: Partial<UserProfile>) => {
    const res = await api.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    setUser(res.user);
  };

  return (
    <AuthContext.Provider value={{
      user,
      partner,
      appSettings,
      isLoading,
      isLocked,
      bothOnline,
      login,
      logout,
      verifyPin,
      lockApp,
      unlockApp,
      updateProfile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
