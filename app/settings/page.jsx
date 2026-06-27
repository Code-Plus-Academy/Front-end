'use client';

import React from 'react';
import Settings from '../../src/views/Settings';
import { PrivateRoute, AppLayout } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <Settings />
      </AppLayout>
    </PrivateRoute>
  );
}
