import React, { Suspense } from 'react';
import Login from '../../src/views/auth/Login';
import { PublicOnlyRoute } from '../../src/components/layout/RouteWrappers';

export const metadata = {
  title: 'Log In | FocusGram',
  description: 'Sign in to FocusGram to access courses, resources, and developer community.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Log In | FocusGram',
    description: 'Sign in to FocusGram to access courses, resources, and developer community.',
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
