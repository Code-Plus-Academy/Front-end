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
  return getSystemTheme(); // 'system' → detect OS preference
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
  // Start as 'system' — before React runs, the beforeInteractive script in
  // layout.jsx has already applied the correct OS-based class to <body>,
  // so there is no flash-of-wrong-theme for logged-out visitors.
  const [theme, setThemeState] = useState('system');
  const [mounted, setMounted] = useState(false);

  // On mount: determine correct starting theme.
  //   • Logged-in user  → their saved settings.theme (fall back to localStorage,
  //                        then system if nothing is set)
  //   • Logged-out user → always 'system' (OS preference); localStorage is
  //                        intentionally ignored so a previous user's stored
  //                        preference never leaks to unauthenticated visitors.
  useEffect(() => {
    setMounted(true);

    if (user) {
      // Authenticated: prefer server-stored setting
      const fromUser = user?.settings?.theme;
      if (fromUser === 'light' || fromUser === 'dark' || fromUser === 'system') {
        setThemeState(fromUser);
        return;
      }
      // User has no server preference yet — check localStorage as a fallback
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemeState(stored);
          return;
        }
      } catch (_) {}
    }

    // Logged out OR no stored preference → always system
    setThemeState('system');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While not yet mounted on the client, resolve from 'system' so the very
  // first render matches what the beforeInteractive script already set.
  const resolvedTheme = mounted ? resolveTheme(theme) : resolveTheme('system');

  // Apply class whenever resolved theme changes
  useEffect(() => {
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme]);

  // Sync when the user object changes (login / logout / settings update):
  //   • Login  → apply user's saved theme preference immediately
  //   • Logout → revert to system theme
  //   • Settings change → apply updated preference
  useEffect(() => {
    if (!mounted) return;

    if (user?.settings?.theme) {
      setThemeState(user.settings.theme);
    } else if (!user) {
      // Logged out → reset to system
      setThemeState('system');
    }
    // user exists but no settings.theme → keep current theme (don't reset)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.settings?.theme, user]);

  // Live-update when OS preference changes while theme is 'system'
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
