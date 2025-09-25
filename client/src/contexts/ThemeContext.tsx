import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  effectiveMode: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isSystemTheme: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

// Get system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    }
    
    // Default to system preference
    return 'system';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);

  // Calculate effective theme mode
  const effectiveMode = mode === 'system' ? systemTheme : mode;

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Set initial value
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('theme', mode);
    
    // Update document class for CSS-based theming
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(effectiveMode);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const theme = effectiveMode === 'light' ? lightTheme : darkTheme;
      metaThemeColor.setAttribute('content', theme.palette.primary.main);
    }
  }, [mode, effectiveMode]);

  const toggleTheme = useCallback(() => {
    setMode(prevMode => {
      switch (prevMode) {
        case 'light':
          return 'dark';
        case 'dark':
          return 'system';
        case 'system':
        default:
          return 'light';
      }
    });
  }, []);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  // Select the appropriate theme
  const theme = effectiveMode === 'light' ? lightTheme : darkTheme;

  const value: ThemeContextValue = {
    mode,
    effectiveMode,
    toggleTheme,
    setTheme,
    isSystemTheme: mode === 'system',
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};