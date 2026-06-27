'use client';

import React from 'react';
import Login from '../../src/views/auth/Login';
import { PublicOnlyRoute } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PublicOnlyRoute>
      <Login />
    </PublicOnlyRoute>
  );
}
