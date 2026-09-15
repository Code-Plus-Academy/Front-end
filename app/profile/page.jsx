'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/context/AuthContext';
import PublicProfile from '../../src/views/PublicProfile';
import { PrivateRoute, AppLayout } from '../../src/components/layout/RouteWrappers';
import LottieProfileLoader from '../../src/components/ui/LottieProfileLoader';

function SelfProfileView() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <LottieProfileLoader />
      </div>
    );
  }

  if (!user?.username) {
    return null;
  }

  return <PublicProfile customUsername={user.username} />;
}

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
          <SelfProfileView />
        </Suspense>
      </AppLayout>
    </PrivateRoute>
  );
}
