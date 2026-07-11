'use client';

import React, { Suspense } from 'react';
import VideoDetailPage from '../../../src/views/VideoDetailPage';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <AppLayout>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
        <VideoDetailPage />
      </Suspense>
    </AppLayout>
  );
}
