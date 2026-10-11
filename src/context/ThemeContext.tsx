import React, { createContext, useContext, useState, useEffect } from 'react';

export type EyeCareTheme = 'warm-paper' | 'soothing-twilight';

interface ThemeContextType {
  theme: EyeCareTheme;
  setTheme: (theme: EyeCareTheme) => void;
  toggleTheme: () => void;
  eyeShield: boolean;
  setEyeShield: (active: boolean) => void;
  toggleEyeShield: () => void;
  isNight: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'cm_eye_care_theme';
const EYE_SHIELD_KEY = 'cm_eye_shield';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved preference or default to eye-friendly 'warm-paper'
  const [theme, setThemeState] = useState<EyeCareTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'warm-paper' || saved === 'soothing-twilight') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'warm-paper';
  });

  const [eyeShield, setEyeShieldState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(EYE_SHIELD_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const setTheme = (newTheme: EyeCareTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'warm-paper' ? 'soothing-twilight' : 'warm-paper');
  };

  const setEyeShield = (active: boolean) => {
    setEyeShieldState(active);
    try {
      localStorage.setItem(EYE_SHIELD_KEY, String(active));
    } catch {
      // ignore
    }
  };

  const toggleEyeShield = () => {
    setEyeShield(!eyeShield);
  };

  // Sync with document element & meta theme-color
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Manage class on body for Tailwind or scoped selectors
    if (theme === 'soothing-twilight') {
      root.classList.add('dark');
      root.classList.remove('warm-paper');
      root.classList.add('soothing-twilight');
    } else {
      root.classList.remove('dark');
      root.classList.remove('soothing-twilight');
      root.classList.add('warm-paper');
    }

    if (eyeShield) {
      root.classList.add('eye-shield-active');
    } else {
      root.classList.remove('eye-shield-active');
    }

    // Update meta theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'soothing-twilight' ? '#181A20' : '#F5F3EC');
    }
  }, [theme, eyeShield]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        eyeShield,
        setEyeShield,
        toggleEyeShield,
        isNight: theme === 'soothing-twilight',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
