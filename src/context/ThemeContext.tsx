import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: ThemeMode;
  currentTheme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  loadTheme: () => void;
  saveTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'cpa_theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(preference: ThemeMode): 'light' | 'dark' {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return getSystemTheme();
}

function applyThemeClass(resolvedTheme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  if (resolvedTheme === 'light') {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

export function ThemeProvider({ children, user: propUser }: { children: React.ReactNode; user?: any }) {
  let authUser = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
  } catch (_) {}

  const user = propUser !== undefined ? propUser : authUser;

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          return stored;
        }
      } catch (_) {}
    }
    return 'light';
  });

  const [, setMounted] = useState(false);

  const applyAndStoreTheme = useCallback((newTheme: ThemeMode, isUserInitiated = false) => {
    setThemeState(newTheme);
    const resolved = resolveTheme(newTheme);
    applyThemeClass(resolved);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch (_) {}
    }

    if (user && isUserInitiated) {
      api.patch('/account/settings', { theme: newTheme }).catch(() => {
        api.patch('/users/me', { theme: newTheme }).catch(() => {});
      });
    }
  }, [user]);

  useEffect(() => {
    setMounted(true);

    const savedUserTheme = user?.settings?.theme || user?.dx_settings?.theme || user?.theme;
    let activeTheme = theme;

    if (savedUserTheme === 'light' || savedUserTheme === 'dark' || savedUserTheme === 'system') {
      activeTheme = savedUserTheme;
      setThemeState(savedUserTheme);
      try {
        localStorage.setItem(STORAGE_KEY, savedUserTheme);
      } catch (_) {}
    } else {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          activeTheme = stored;
          setThemeState(stored);
        }
      } catch (_) {}
    }

    const resolved = resolveTheme(activeTheme);
    applyThemeClass(resolved);
  }, [user]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const activeSysTheme = e.matches ? 'dark' : 'light';
      applyThemeClass(activeSysTheme);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    applyAndStoreTheme(newTheme, true);
  }, [applyAndStoreTheme]);

  const loadTheme = useCallback(() => {
    const saved = user?.settings?.theme || user?.dx_settings?.theme || user?.theme;
    if (saved) {
      setThemeState(saved);
      applyThemeClass(resolveTheme(saved));
    }
  }, [user]);

  const saveTheme = useCallback((targetTheme: ThemeMode) => {
    applyAndStoreTheme(targetTheme, true);
  }, [applyAndStoreTheme]);

  const toggleTheme = useCallback(() => {
    const currentResolved = resolveTheme(theme);
    const nextTheme = currentResolved === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  const resolvedTheme = resolveTheme(theme);

  return (
    <ThemeContext.Provider value={{
      theme,
      currentTheme: theme,
      resolvedTheme,
      setTheme,
      loadTheme,
      saveTheme,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
