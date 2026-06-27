'use client';

import React from 'react';
import VideoDetailPage from '../../../src/views/VideoDetailPage';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <AppLayout>
      <VideoDetailPage />
    </AppLayout>
  );
}
