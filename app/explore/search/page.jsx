'use client';

import React, { Suspense } from 'react';
import SearchPage from '../../../src/views/SearchPage';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <AppLayout>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
        <SearchPage />
      </Suspense>
    </AppLayout>
  );
}
