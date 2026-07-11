'use client';

import React, { Suspense } from 'react';
import { Network } from '../../src/views/Social';
import { PrivateRoute, AppLayout } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
          <Network />
        </Suspense>
      </AppLayout>
    </PrivateRoute>
  );
}
