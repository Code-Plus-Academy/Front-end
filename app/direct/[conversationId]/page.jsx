'use client';

import React from 'react';
import { DMThread } from '../../../src/views/DM';
import { PrivateRoute, AppLayout } from '../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <DMThread />
      </AppLayout>
    </PrivateRoute>
  );
}
