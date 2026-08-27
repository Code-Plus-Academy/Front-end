'use client';

import React from 'react';
import NewPost from '../../../src/views/NewPost';
import { PrivateRoute, AppLayout } from '../../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PrivateRoute>
      <AppLayout>
        <NewPost />
      </AppLayout>
    </PrivateRoute>
  );
}
