'use client';

import React, { Suspense } from 'react';
import Feed from '../../src/views/Feed';
import { PrivateRoute, AppLayout } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <Suspense fallback={null}>
          <Feed />
        </Suspense>
      </AppLayout>
    </PrivateRoute>
  );
}
