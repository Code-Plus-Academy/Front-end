'use client';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
export default function NotFound() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) router.replace(user ? '/feed' : '/');
  }, [loading, user, router]);
  return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
}
