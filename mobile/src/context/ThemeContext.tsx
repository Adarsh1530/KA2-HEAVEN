import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  reduceMotion: boolean;
  setReduceMotion: (val: boolean) => void;
  soundEffects: boolean;
  setSoundEffects: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('ka2_theme') as ThemeMode) || 'dark';
  });
  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => {
    return localStorage.getItem('ka2_reduce_motion') === 'true';
  });
  const [soundEffects, setSoundEffectsState] = useState<boolean>(() => {
    return localStorage.getItem('ka2_sound_effects') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('ka2_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setReduceMotion = (val: boolean) => {
    setReduceMotionState(val);
    localStorage.setItem('ka2_reduce_motion', String(val));
  };

  const setSoundEffects = (val: boolean) => {
    setSoundEffectsState(val);
    localStorage.setItem('ka2_sound_effects', String(val));
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      reduceMotion,
      setReduceMotion,
      soundEffects,
      setSoundEffects,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
