'use client';

import React from 'react';
import ShowcaseCreate from '../../../src/views/ShowcaseCreate';
import { PrivateRoute, AppLayout } from '../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <ShowcaseCreate />
      </AppLayout>
    </PrivateRoute>
  );
}
