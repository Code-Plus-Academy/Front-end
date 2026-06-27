'use client';

import React from 'react';
import { Saved } from '../../src/views/Social';
import { PrivateRoute, AppLayout } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <Saved />
      </AppLayout>
    </PrivateRoute>
  );
}
