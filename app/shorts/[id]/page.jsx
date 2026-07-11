'use client';

import React, { Suspense } from 'react';
import ShortsPage from '../../../src/views/ShortsPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <ShortsPage />
    </Suspense>
  );
}
