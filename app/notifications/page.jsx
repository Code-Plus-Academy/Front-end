'use client';

import React from 'react';
import Notifications from '../../src/views/Notifications';
import { PrivateRoute, AppLayout } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <Notifications />
      </AppLayout>
    </PrivateRoute>
  );
}
