'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

/**
 * PrivateRoute — redirects unauthenticated users to /login
 */
export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(pathname + (searchParams?.toString() ? '?' + searchParams.toString() : ''));
      router.replace(`/login?next=${next}`);
    }
  }, [loading, user, pathname, searchParams, router]);

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
  if (!user) return null;
  return children;
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
