'use client';

import React from 'react';
import Feed from '../../src/views/Feed';
import { PrivateRoute, AppLayout } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <Feed />
      </AppLayout>
    </PrivateRoute>
  );
}
