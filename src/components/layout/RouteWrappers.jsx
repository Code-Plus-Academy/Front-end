'use client';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, Navigate } from 'react-router-dom'; // Will resolve to routerShim

import Navbar from './Navbar';
import SidebarRail from './SidebarRail';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';

import { getRedirectTarget } from '../../utils/navigation';

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
  if (!user) {
    if (location.pathname.startsWith('/login') || location.pathname.startsWith('/register')) {
      return children;
    }
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (user.onboarding_completed === false && !location.pathname.startsWith('/register')) {
    return <Navigate to={`/register?step=${user.onboarding_step || 2}`} replace />;
  }
  return children;
}

export function ProfessionalRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (user.onboarding_completed === false && !location.pathname.startsWith('/register')) {
    return <Navigate to={`/register?step=${user.onboarding_step || 2}`} replace />;
  }
  if (user.account_type === 'personal') {
    const target = getRedirectTarget(location.search, '/feed');
    return <Navigate to={target} replace />;
  }
  return children;
}

export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (user) {
    if (user.onboarding_completed === false && (location.pathname.startsWith('/register') || location.pathname.startsWith('/login'))) {
      return children;
    }
    const target = getRedirectTarget(location.search, '/feed');
    return <Navigate to={target} replace />;
  }
  return children;
}

export function RegisterRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
  if (user && user.onboarding_completed) {
    const target = getRedirectTarget(location.search, '/feed');
    return <Navigate to={target} replace />;
  }
  return children;
}

export function AppLayout({ children, hideNav = false, noPadding = false, showFooter: showFooterProp }) {
  const location = useLocation();
  const isPrivate = (pathname) => {
    const privatePatterns = [
      /^\/feed(\/.*)?$/i,
      /^\/network(\/.*)?$/i,
      /^\/direct(\/.*)?$/i,
      /^\/saved(\/.*)?$/i,
      /^\/notifications(\/.*)?$/i,
      /^\/settings(\/.*)?$/i,
      /^\/videos$/i,
      /^\/posts\/new(\/.*)?$/i,
      /^\/posts\/.*\/edit(\/.*)?$/i,
      /^\/creator\/dashboard(\/.*)?$/i
    ];
    return privatePatterns.some(pattern => pattern.test(pathname));
  };
  const showFooter = showFooterProp !== undefined ? showFooterProp : !isPrivate(location.pathname);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {!hideNav && <Navbar />}
      {!hideNav && <SidebarRail />}
      {/* Layouts that manage their own spacing pass noPadding=true */}
      <main className="app-main" style={{
        flex: 1,
        marginLeft: hideNav ? 0 : 240,
        marginTop: hideNav ? 0 : 64,
        transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div className={`app-content-pad${noPadding ? ' no-pad' : ''}`} style={{
          flex: 1,
          ...(noPadding ? {} : { padding: '16px 32px' }),
        }}>
          {noPadding ? children : (
            <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
              {children}
            </div>
          )}
        </div>
        {showFooter && <Footer />}
      </main>
      {!hideNav && <MobileBottomNav />}
      <style>{`
        @media (max-width: 1311px) {
          .app-main { margin-left: 92px !important; }
        }
        @media(max-width: 768px) {
          .app-main { margin-left: 0 !important; }
          .app-content-pad:not(.no-pad) { padding: 12px 0 !important; }
        }
      `}</style>
    </div>
  );
}