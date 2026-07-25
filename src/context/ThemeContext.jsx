import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'cpa_theme';

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
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
    // Safely attempt to read user from AuthContext if not passed directly as a prop
    const auth = useAuth();
    authUser = auth?.user;
  } catch (_) {}

  const user = propUser !== undefined ? propUser : authUser;

  const [theme, setThemeState] = useState('light');
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

    if (!user) {
      // 1. Unauthenticated / Guest: Always Light mode by default
      setThemeState('light');
      applyThemeClass('light');
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    } else {
      // 2. Authenticated user: Priority 1 = Saved Account Theme
      const savedUserTheme = user?.settings?.theme || user?.dx_settings?.theme || user?.theme;
      if (savedUserTheme === 'light' || savedUserTheme === 'dark' || savedUserTheme === 'system') {
        setThemeState(savedUserTheme);
        applyThemeClass(resolveTheme(savedUserTheme));
      } else {
        // Priority 2 = Check local storage or default to system theme
        let initialTheme = 'system';
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored === 'light' || stored === 'dark' || stored === 'system') {
            initialTheme = stored;
          }
        } catch (_) {}
        setThemeState(initialTheme);
        applyThemeClass(resolveTheme(initialTheme));
      }
    }
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
    if (!user) {
      applyThemeClass('light');
      setThemeState('light');
      return;
    }
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
    const currentResolved = mounted ? resolveTheme(theme) : 'light';
    const nextTheme = currentResolved === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [mounted, theme, setTheme]);

  const resolvedTheme = !user ? 'light' : resolveTheme(theme);

  return (
    <ThemeContext.Provider value={{
      theme: !user ? 'light' : theme,
      currentTheme: !user ? 'light' : theme,
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
