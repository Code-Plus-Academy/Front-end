'use client';

import React from 'react';
import { DMInbox } from '../../src/views/DM';
import { PrivateRoute, AppLayout } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <DMInbox />
      </AppLayout>
    </PrivateRoute>
  );
}
