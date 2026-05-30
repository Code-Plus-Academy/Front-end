'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'cpa_theme';

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolveTheme(preference) {
  if (preference === 'light') return 'light';
  if (preference === 'dark')  return 'dark';
  return getSystemTheme();
}

function applyThemeClass(resolvedTheme) {
  if (typeof document === 'undefined') return;
  if (resolvedTheme === 'light') {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  } else {
    document.body.classList.remove('light-mode');
    document.body.classList.remove('dark-mode');
  }
}

export function ThemeProvider({ children, user }) {
  const getInitialPreference = () => {
    if (user?.settings?.theme) return user.settings.theme;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    }
    return 'system';
  };

  const [theme, setThemeState] = useState('system');
  const resolvedTheme = resolveTheme(theme);

  // Init from storage/user on mount (client-only)
  useEffect(() => {
    setThemeState(getInitialPreference());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (user?.settings?.theme) {
      setThemeState(user.settings.theme);
    }
  }, [user?.settings?.theme]);

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

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: 'dark', resolvedTheme: 'dark', setTheme: () => {}, toggleTheme: () => {} };
  return ctx;
}
