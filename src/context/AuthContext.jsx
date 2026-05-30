'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api, { baseApiUrl } from '../api/axios';

const DEFAULT = {
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  refreshUser: async () => {},
};

const AuthContext = createContext(DEFAULT);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        // Guard: res.data may be undefined/malformed if the API route 404s or
        // returns an unexpected payload — safe-access prevents the crash.
        setUser(res.data?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  const login = useCallback((userData) => setUser(userData), []);

  const logout = useCallback(async () => {
    setUser(null);
    try {
      await fetch(baseApiUrl + '/auth/logout', { method: 'POST', credentials: 'include', keepalive: true });
    } catch {}
    setTimeout(() => router.push('/'), 100);
  }, [router]);

  const updateUser = useCallback((patch) => {
    setUser(prev => prev ? { ...prev, ...patch } : prev);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      // Same safe-access guard as the initial load above.
      setUser(res.data?.user ?? null);
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

export const useAuth = () => useContext(AuthContext);
