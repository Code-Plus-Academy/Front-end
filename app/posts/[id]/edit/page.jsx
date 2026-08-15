'use client';

import React from 'react';
import EditPost from '../../../../src/views/EditPost';
import { PrivateRoute, AppLayout } from '../../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout noPadding>
        <EditPost />
      </AppLayout>
    </PrivateRoute>
  );
}
