'use client';

import React from 'react';
import VideosPage from '../../src/views/VideosPage';
import { PrivateRoute, AppLayout } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <VideosPage />
      </AppLayout>
    </PrivateRoute>
  );
}
