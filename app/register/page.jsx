'use client';

import React from 'react';
import Register from '../../src/views/auth/Register';
import { PublicOnlyRoute } from '../../src/components/layout/RouteWrappers';

export default function Page() {
  return (
    <PublicOnlyRoute>
      <Register />
    </PublicOnlyRoute>
  );
}
