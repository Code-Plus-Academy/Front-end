'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, Navigate } from 'react-router-dom'; // Will resolve to routerShim

import Navbar from './Navbar';
import SidebarRail from './SidebarRail';

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}

export function ProfessionalRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.account_type === 'personal') return <Navigate to="/feed" replace />;
  return children;
}

export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/feed" replace />;
  return children;
}

export function AppLayout({ children, hideNav = false, noPadding = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {!hideNav && <Navbar />}
      {!hideNav && <SidebarRail />}
      {/* Layouts that manage their own spacing pass noPadding=true */}
      <main style={{
        flex: 1,
        marginLeft: hideNav ? 0 : 240,
        marginTop: hideNav ? 0 : 64,
        ...(noPadding ? {} : { padding: '16px 32px' }),
      }}>
        {noPadding ? children : (
          <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
            {children}
          </div>
        )}
      </main>
      <style>{`
        @media(max-width: 768px) {
          main { margin-left: 0 !important; }
        }
        @media(max-width: 768px) {
          main:not(.no-pad) { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
