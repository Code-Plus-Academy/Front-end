'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { baseApiUrl } from '../api/axios';
import { getGraphQLMe, normalizeGraphQLUser } from '../api/graphql';
import supabase from '../lib/supabaseClient';
import { getRedirectTarget, getStoredRedirect, clearStoredRedirect } from '../utils/navigation';

const AuthContext = createContext(null);

/**
 * Native Supabase Session Management with GraphQL Auth & Instant Hydration:
 * - Instant 0ms hydration from localStorage cached profile (`cpa_user`)
 * - Zero blocking waterfall: Bearer token is sent with all requests automatically
 * - Background profile sync & revalidation via GraphQL `ME_QUERY`
 * - Synchronizes with supabase.auth.onAuthStateChange
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('cpa_access_token');
        const cached = localStorage.getItem('cpa_user');
        if (token && cached) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return JSON.parse(cached);
        }
      } catch (_) {}
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cpa_access_token');
      const cached = localStorage.getItem('cpa_user');
      if (token && cached) {
        // Instant hydration! No blocking blank screen on reload.
        return false;
      }
    }
    return true;
  });

  // Synchronize user and API token via GraphQL
  const syncSession = useCallback(async (session) => {
    if (session?.access_token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cpa_access_token', session.access_token);
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
    }

    try {
      const meData = await getGraphQLMe();
      if (meData) {
        setUser(meData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cpa_user', JSON.stringify(meData));
        }
      } else {
        const res = await api.get('/auth/me');
        const normalized = normalizeGraphQLUser(res.data.user);
        setUser(normalized);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cpa_user', JSON.stringify(normalized));
        }
      }
    } catch (gqlErr) {
      if (gqlErr?.extensions?.code === 'UNAUTHENTICATED' || gqlErr?.response?.status === 401) {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cpa_user');
        }
      } else {
        try {
          const res = await api.get('/auth/me');
          const normalized = normalizeGraphQLUser(res.data.user);
          setUser(normalized);
          if (typeof window !== 'undefined') {
            localStorage.setItem('cpa_user', JSON.stringify(normalized));
          }
        } catch {
          // Retain cached user on network error (graceful degradation)
          setUser(prev => prev);
        }
      }
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

    // 2. Initial Session Check via Supabase & GraphQL
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        syncSession(session);
      } else {
        // Revalidate against GraphQL me
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('cpa_access_token');
          if (token && !api.defaults.headers.common['Authorization']) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
        }
        getGraphQLMe()
          .then(meData => {
            if (isMounted) {
              if (meData) {
                setUser(meData);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('cpa_user', JSON.stringify(meData));
                }
              }
              setLoading(false);
            }
          })
          .catch((err) => {
            if (isMounted) {
              if (err?.extensions?.code === 'UNAUTHENTICATED' || err?.response?.status === 401) {
                setUser(null);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('cpa_user');
                }
              }
              setLoading(false);
            }
          });
      }
    }).catch(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    // 3. Supabase Auth State Change Listener (Native Session Persistence & Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.access_token) {
          localStorage.setItem('cpa_access_token', session.access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
        }
        getGraphQLMe()
          .then(meData => {
            if (meData) {
              setUser(meData);
              if (typeof window !== 'undefined') {
                localStorage.setItem('cpa_user', JSON.stringify(meData));
              }
            }
          })
          .catch(() => {});
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cpa_user');
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
    const rawUser = userData?.user || userData;
    const normalized = normalizeGraphQLUser(rawUser);
    if (normalized && typeof window !== 'undefined') {
      localStorage.setItem('cpa_user', JSON.stringify(normalized));
    }
    setUser(normalized || rawUser);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('cpa_refresh_token') : null;
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('cpa_access_token') : null;

    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cpa_user');
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
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      if (typeof window !== 'undefined') {
        localStorage.setItem('cpa_user', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const meData = await getGraphQLMe();
      if (meData) {
        setUser(meData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cpa_user', JSON.stringify(meData));
        }
        return meData;
      }
      const res = await api.get('/auth/me');
      const normalized = normalizeGraphQLUser(res.data?.user);
      if (normalized) {
        setUser(normalized);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cpa_user', JSON.stringify(normalized));
        }
      }
      return normalized || null;
    } catch {
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

