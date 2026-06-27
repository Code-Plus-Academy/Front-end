import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'cpa_theme';

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolveTheme(preference) {
  if (preference === 'light') return 'light';
  if (preference === 'dark')  return 'dark';
  return getSystemTheme(); // 'system' → detect
}

function applyThemeClass(resolvedTheme) {
  if (typeof document === 'undefined') return;
  if (resolvedTheme === 'light') {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  } else {
    document.body.classList.remove('light-mode');
    document.body.classList.remove('dark-mode'); // dark is default — no class needed
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children, user }) {
  // Always start with 'dark' on SSR — hydrate from localStorage on client
  const [theme, setThemeState] = useState('dark');
  const [mounted, setMounted] = useState(false);

  // On mount: read from user settings → localStorage → default 'dark'
  useEffect(() => {
    setMounted(true);
    const fromUser = user?.settings?.theme;
    if (fromUser === 'light' || fromUser === 'dark' || fromUser === 'system') {
      setThemeState(fromUser);
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored);
      }
    } catch (_) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolvedTheme = mounted ? resolveTheme(theme) : 'dark';

  // Apply class whenever resolved theme changes
  useEffect(() => {
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme]);

  // Sync from user object when it changes (login/logout)
  useEffect(() => {
    if (user?.settings?.theme) {
      setThemeState(user.settings.theme);
    }
  }, [user?.settings?.theme]);

  // Listen for system preference changes when user chose 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => applyThemeClass(resolveTheme('system'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyThemeClass(resolveTheme(newTheme));

    // Async sync to backend — fire and forget, non-blocking
    api.patch('/account/settings', { theme: newTheme }).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
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
