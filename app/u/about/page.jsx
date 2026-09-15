'use client';

import React, { Suspense } from 'react';
import AboutAccount from '../../../src/views/AboutAccount';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';
import LottieProfileLoader from '../../../src/components/ui/LottieProfileLoader';

export default function Page() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LottieProfileLoader />
        </div>
      }>
        <AboutAccount />
      </Suspense>
    </AppLayout>
  );
}
