'use client';

import React from 'react';
import PublishStatusPage from '../../../../src/views/PublishStatusPage';
import { PrivateRoute, AppLayout } from '../../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <PublishStatusPage />
      </AppLayout>
    </PrivateRoute>
  );
}
