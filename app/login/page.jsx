import React, { Suspense } from 'react';
import Login from '../../src/views/auth/Login';
import { PublicOnlyRoute } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Log In',
  description: 'Sign in to Code Plus Academy to access courses, resources, and community.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Log In | Code Plus Academy',
    description: 'Sign in to Code Plus Academy to access courses, resources, and community.',
    url: '/login',
  }
};

export default function Page() {
  return (
    <PublicOnlyRoute>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
        <Login />
      </Suspense>
    </PublicOnlyRoute>
  );
}
