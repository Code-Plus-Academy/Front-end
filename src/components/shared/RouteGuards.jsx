'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

/**
 * PrivateRoute — redirects unauthenticated users to /login
 */
function PrivateRouteInner({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, pathname, router]);

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
  if (!user) return null;
  return children;
}

export function PrivateRoute({ children }) {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <PrivateRouteInner>{children}</PrivateRouteInner>
    </Suspense>
  );
}

/**
 * ProfessionalRoute — only for non-personal account types
 */
export function ProfessionalRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (user.account_type === 'personal') router.replace('/feed');
    }
  }, [loading, user, router]);

  if (loading) return null;
  if (!user || user.account_type === 'personal') return null;
  return children;
}

/**
 * PublicOnlyRoute — redirects logged-in users away from auth pages
 */
export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/feed');
  }, [loading, user, router]);

  if (loading) return null;
  if (user) return null;
  return children;
}
