'use client';

import React, { Suspense } from 'react';
import Settings from '../../../src/views/Settings';
import { PrivateRoute, AppLayout } from '../../../src/components/layout/RouteWrappers';
import LottieProfileLoader from '../../../src/components/ui/LottieProfileLoader';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <Suspense fallback={
          <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LottieProfileLoader />
          </div>
        }>
          <Settings initialSection="profile" />
        </Suspense>
      </AppLayout>
    </PrivateRoute>
  );
}
