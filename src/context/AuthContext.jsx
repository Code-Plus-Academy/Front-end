'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { baseApiUrl } from '../api/axios';
import supabase from '../lib/supabaseClient';
import { getRedirectTarget, getStoredRedirect, clearStoredRedirect } from '../utils/navigation';

const AuthContext = createContext(null);

/**
 * Native Supabase Session Management:
 * - autoRefreshToken: true & persistSession: true in supabaseClient
 * - Synchronizes with supabase.auth.onAuthStateChange
 * - Integrates /api/auth/me for application user profile & preferences
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize user and API token
  const syncSession = useCallback(async (session) => {
    if (session?.access_token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cpa_access_token', session.access_token);
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      // If server profile not found with current token, keep user null
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Check URL parameters for OAuth or magic link tokens
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlAccessToken = params.get('access_token');
      const urlRefreshToken = params.get('token');
      const isResetPasswordRoute = window.location.pathname.startsWith('/reset-password');

      if (!isResetPasswordRoute && (urlAccessToken || urlRefreshToken)) {
        if (urlAccessToken) {
          localStorage.setItem('cpa_access_token', urlAccessToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${urlAccessToken}`;
        }
        if (urlRefreshToken) {
          localStorage.setItem('cpa_refresh_token', urlRefreshToken);
        }

        // Authorize and resolve URL-based redirect target (from query params or pre-OAuth session)
        const redirectTarget = getRedirectTarget(window.location.search) || getStoredRedirect();
        clearStoredRedirect();

        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        if (redirectTarget) {
          if (redirectTarget.startsWith('http://') || redirectTarget.startsWith('https://')) {
            window.location.href = redirectTarget;
            return;
          } else if (window.location.pathname !== redirectTarget || window.location.pathname === '/login' || window.location.pathname === '/') {
            window.location.href = redirectTarget;
            return;
          }
        }
      }
    }

    // 2. Initial Session Check via Supabase & Backend
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        syncSession(session);
      } else {
        // Fallback check against backend /auth/me with cookies/localStorage
        api.get('/auth/me')
          .then(res => {
            if (isMounted) {
              setUser(res.data.user);
              setLoading(false);
            }
          })
          .catch(() => {
            if (isMounted) {
              setUser(null);
              setLoading(false);
            }
          });
      }
    }).catch(() => {
      if (isMounted) {
        api.get('/auth/me')
          .then(res => { if (isMounted) { setUser(res.data.user); setLoading(false); } })
          .catch(() => { if (isMounted) { setUser(null); setLoading(false); } });
      }
    });

    // 3. Supabase Auth State Change Listener (Native Session Persistence & Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.access_token) {
          localStorage.setItem('cpa_access_token', session.access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
        }
        api.get('/auth/me')
          .then(res => setUser(res.data.user))
          .catch(() => {});
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cpa_access_token');
          localStorage.removeItem('cpa_refresh_token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [syncSession]);

  const login = useCallback((userData) => {
    if (userData?.access_token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cpa_access_token', userData.access_token);
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`;
    }
    setUser(userData?.user || userData);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('cpa_refresh_token') : null;
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('cpa_access_token') : null;

    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cpa_access_token');
      localStorage.removeItem('cpa_refresh_token');
      delete api.defaults.headers.common['Authorization'];
    }

    try {
      await supabase.auth.signOut();
    } catch {}

    try {
      await api.post('/auth/logout', { refresh_token: refreshToken, token: accessToken });
    } catch {
      try {
        const logoutUrl = baseApiUrl + '/auth/logout';
        await fetch(logoutUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ refresh_token: refreshToken, token: accessToken }),
          credentials: 'include',
          keepalive: true,
        });
      } catch {}
    }
  }, []);

  const updateUser = useCallback((patch) => {
    setUser(prev => prev ? { ...prev, ...patch } : prev);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      return res.data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

