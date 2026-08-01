import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { baseApiUrl } from '../api/axios';

const AuthContext = createContext(null);

/**
 * Authentication is handled exclusively via the HTTP-only `cpa_token` cookie
 * set by the backend. localStorage storage of JWTs is intentionally removed
 * to prevent XSS attacks from stealing the token.
 *
 * The /api/auth/me endpoint is the source of truth:
 *   - Sets a provisional user state on load (from the server response)
 *   - Clears user on 401 from any protected endpoint
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlAccessToken = params.get('access_token');
      const urlRefreshToken = params.get('token');

      if (urlAccessToken) {
        localStorage.setItem('cpa_access_token', urlAccessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${urlAccessToken}`;
      }
      if (urlRefreshToken) {
        localStorage.setItem('cpa_refresh_token', urlRefreshToken);
      }

      if (urlAccessToken || urlRefreshToken) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    // Verify session with server
    api.get('/auth/me')
      .then(res => {
        setUser(res.data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  // Proactive silent-refresh timer (runs at 80% of 15m access token lifetime = 12 mins)
  useEffect(() => {
    if (!user) return;

    const SILENT_REFRESH_MS = 12 * 60 * 1000;
    const timer = setTimeout(async () => {
      try {
        const refreshRes = await api.post('/auth/refresh');
        if (refreshRes.data?.access_token) {
          localStorage.setItem('cpa_access_token', refreshRes.data.access_token);
        }
      } catch (err) {
        console.warn('[AuthContext] Silent refresh failed:', err.message);
      }
    }, SILENT_REFRESH_MS);

    return () => clearTimeout(timer);
  }, [user]);

  const login = useCallback((userData) => {
    if (userData?.access_token) {
      localStorage.setItem('cpa_access_token', userData.access_token);
    }
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cpa_access_token');
      localStorage.removeItem('cpa_refresh_token');
    }

    // Use fetch with keepalive:true — survives page unload unlike api.post
    // This guarantees the server receives the logout request and clears the cookie
    // even after window.location.href fires
    const logoutUrl = baseApiUrl + '/auth/logout';
    try {
      await fetch(logoutUrl, {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
      });
    } catch { }

    // 100ms buffer ensures browser processes Set-Cookie: clear response
    // before the page reload triggers /auth/me again
    setTimeout(() => { window.location.href = '/'; }, 100);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser(prev => prev ? { ...prev, ...patch } : prev);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
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
