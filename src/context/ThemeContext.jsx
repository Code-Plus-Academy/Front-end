import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'cpa_theme';

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(preference) {
  if (preference === 'light') return 'light';
  if (preference === 'dark')  return 'dark';
  return getSystemTheme(); // 'system' → detect OS preference
}

function applyThemeClass(resolvedTheme) {
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

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children, user: propUser }) {
  let authUser = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
  } catch (_) {}

  const user = propUser !== undefined ? propUser : authUser;

  // Initialize theme preference from localStorage or default to dark
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          return stored;
        }
      } catch (_) {}
    }
    return 'dark';
  });

  const [mounted, setMounted] = useState(false);

  // Helper to update state, DOM, local storage, and backend API
  const applyAndStoreTheme = useCallback((newTheme, isUserInitiated = false) => {
    setThemeState(newTheme);
    const resolved = resolveTheme(newTheme);
    applyThemeClass(resolved);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch (_) {}
    }

    if (user && isUserInitiated) {
      // Sync theme preference to user profile in DB
      api.patch('/account/settings', { theme: newTheme }).catch(() => {
        api.patch('/users/me', { theme: newTheme }).catch(() => {});
      });
    }
  }, [user]);

  // Initial Sync & Auth-state changes
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
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          activeTheme = stored;
          setThemeState(stored);
        }
      } catch (_) {}
    }

    const resolved = resolveTheme(activeTheme);
    applyThemeClass(resolved);
  }, [user]);

  // Live listener for OS preference when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const activeSysTheme = e.matches ? 'dark' : 'light';
      applyThemeClass(activeSysTheme);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    applyAndStoreTheme(newTheme, true);
  }, [applyAndStoreTheme]);

  const loadTheme = useCallback(() => {
    const saved = user?.settings?.theme || user?.dx_settings?.theme || user?.theme;
    if (saved) {
      setThemeState(saved);
      applyThemeClass(resolveTheme(saved));
    }
  }, [user]);

  const saveTheme = useCallback((targetTheme) => {
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

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
